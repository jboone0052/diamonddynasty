import { economyConfig, simConfig } from "@baseball-sim/config";
import { simulateGame } from "../sim/simulateGame";
import { GameState, Player, PromotionStatus, ScheduledGame, Team } from "../types/gameState";
import { nextSeededValue } from "../utils/rng";

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function nextRoll(state: GameState) {
  const value = nextSeededValue(state.rng.seed, state.rng.step);
  state.rng.step += 1;
  return value;
}

function addDays(date: string, days: number) {
  const next = new Date(`${date}T00:00:00Z`);
  next.setUTCDate(next.getUTCDate() + days);
  return next.toISOString().slice(0, 10);
}

function createEmptyStats() {
  return {
    games: 0,
    atBats: 0,
    runs: 0,
    hits: 0,
    runsBattedIn: 0,
    walks: 0,
    strikeouts: 0,
    doubles: 0,
    triples: 0,
    homeRuns: 0,
    battingAverage: 0,
    stolenBases: 0,
    inningsPitched: 0,
    wins: 0,
    losses: 0,
    saves: 0,
    hitsAllowed: 0,
    earnedRuns: 0,
    walksAllowed: 0,
    strikeoutsPitched: 0,
    homeRunsAllowed: 0,
  };
}

function createRevenueBreakdown() {
  return {
    ticketSales: 0,
    sponsorships: 0,
    merchandise: 0,
    playoffRevenue: 0,
    transferFees: 0,
    other: 0,
  };
}

function createExpenseBreakdown() {
  return {
    payroll: 0,
    staff: 0,
    travel: 0,
    upkeep: 0,
    scouting: 0,
    marketing: 0,
    debtService: 0,
    other: 0,
  };
}

function generateRoundRobinWeeks(teamIds: string[]) {
  const rotation = [...teamIds];
  const rounds: Array<Array<[string, string]>> = [];

  for (let round = 0; round < teamIds.length - 1; round += 1) {
    const week: Array<[string, string]> = [];
    for (let i = 0; i < rotation.length / 2; i += 1) {
      const home = rotation[i];
      const away = rotation[rotation.length - 1 - i];
      week.push(round % 2 === 0 ? [home, away] : [away, home]);
    }
    rounds.push(week);
    const fixed = rotation[0];
    const rest = rotation.slice(1);
    rest.unshift(rest.pop()!);
    rotation.splice(0, rotation.length, fixed, ...rest);
  }

  const mirrored = rounds.map((week) => week.map(([home, away]) => [away, home] as [string, string]));
  return [...rounds, ...mirrored];
}

function syncTeamFinances(state: GameState) {
  Object.values(state.teams).forEach((team) => {
    const finance = state.finances[team.id];
    team.cash = finance.currentCash;
    team.debt = finance.currentDebt;
  });
}

function getHealthyRoster(team: Team, state: GameState) {
  return team.rosterPlayerIds.filter((playerId) => {
    const player = state.players[playerId];
    return player && player.status !== "injured" && player.status !== "suspended" && player.status !== "retired";
  });
}

function reconcileTeam(state: GameState, teamId: string) {
  const team = state.teams[teamId];
  const healthy = getHealthyRoster(team, state);
  if (healthy.length < 9) {
    return;
  }

  const battingOrder = team.activeLineup.battingOrderPlayerIds.filter((playerId) => healthy.includes(playerId));
  for (const playerId of healthy) {
    if (battingOrder.length >= 9) {
      break;
    }
    if (!battingOrder.includes(playerId)) {
      battingOrder.push(playerId);
    }
  }

  team.activeLineup.battingOrderPlayerIds = battingOrder;
  const defenseKeys = ["P", "C", "1B", "2B", "3B", "SS", "LF", "CF", "RF", "DH"] as const;
  defenseKeys.forEach((position, index) => {
    team.activeLineup.defensiveAssignments[position] = position === "P"
      ? (team.rotation.starterPlayerIds[team.rotation.nextStarterIndex % team.rotation.starterPlayerIds.length] ?? healthy[0])
      : battingOrder[Math.min(index - 1 >= 0 ? index - 1 : 0, battingOrder.length - 1)];
  });
  team.activeLineup.designatedHitterPlayerId = battingOrder[8];

  const healthyPitchers = healthy.filter((playerId) => {
    const primaryPosition = state.players[playerId].primaryPosition;
    return primaryPosition === "SP" || primaryPosition === "RP";
  });
  if (healthyPitchers.length >= 3) {
    const starters = team.rotation.starterPlayerIds.filter((playerId) => healthyPitchers.includes(playerId));
    for (const playerId of healthyPitchers) {
      if (starters.length >= Math.min(5, healthyPitchers.length)) {
        break;
      }
      if (!starters.includes(playerId)) {
        starters.push(playerId);
      }
    }
    team.rotation.starterPlayerIds = starters;
    team.bullpenPlayerIds = healthyPitchers.filter((playerId) => !starters.includes(playerId)).slice(0, 4);
  }

  team.reservePlayerIds = team.rosterPlayerIds.filter((playerId) => !battingOrder.includes(playerId) && !team.rotation.starterPlayerIds.includes(playerId));
  team.injuredPlayerIds = team.rosterPlayerIds.filter((playerId) => state.players[playerId].status === "injured");
}

function recalculateBattingAverage(player: Player) {
  player.seasonStats.battingAverage = player.seasonStats.atBats === 0
    ? 0
    : Number((player.seasonStats.hits / player.seasonStats.atBats).toFixed(3));
  player.careerStats.battingAverage = player.careerStats.atBats === 0
    ? 0
    : Number((player.careerStats.hits / player.careerStats.atBats).toFixed(3));
}

function clampFatigue(value: number) {
  return Math.max(0, Math.min(100, Number(value.toFixed(1))));
}

function getHitterFatigueCost(line?: {
  atBats: number;
  walks: number;
  runs: number;
  strikeouts: number;
  stolenBases: number;
}) {
  if (!line) {
    return simConfig.fatigueIncreaseHitters * 0.35;
  }

  const workload = (line.atBats * 0.9)
    + (line.walks * 0.55)
    + (line.runs * 0.3)
    + (line.strikeouts * 0.2)
    + (line.stolenBases * 0.75);
  return Math.max(simConfig.fatigueIncreaseHitters * 0.35, workload + 0.8);
}

function getPitcherFatigueCost(player: Player, line: {
  inningsPitched: number;
  pitchesThrown: number;
  hitsAllowed: number;
  earnedRuns: number;
  walks: number;
}) {
  const stamina = player.ratings.pitching?.stamina ?? 45;
  const staminaRelief = Math.max(-2.5, Math.min(2.5, (stamina - 50) / 10));
  const stressLoad = (line.pitchesThrown * 0.16)
    + (line.inningsPitched * 2.4)
    + (line.hitsAllowed * 0.45)
    + (line.walks * 0.55)
    + (line.earnedRuns * 0.9);
  return Math.max(simConfig.fatigueIncreasePitchers * 0.35, stressLoad - staminaRelief);
}

function clampRating(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function getStandingRow(state: GameState, teamId: string) {
  const team = state.teams[teamId];
  return state.standings[team.leagueId].rows.find((row) => row.teamId === teamId);
}

function getTargetTicketPrice(team: Team) {
  return Math.max(
    7,
    Math.min(
      20,
      economyConfig.baseTicketPrice
        + Math.round((team.marketSize - 45) / 12)
        + Math.round((team.prestige - 35) / 18)
        + Math.round((team.fanInterest - 40) / 20),
    ),
  );
}

function getFanInterestDelta(state: GameState, game: ScheduledGame, teamId: string, opponentId: string, wonGame: boolean) {
  const team = state.teams[teamId];
  const opponent = state.teams[opponentId];
  const finance = state.finances[teamId];
  const row = getStandingRow(state, teamId);
  const result = game.result!;
  const scoreMargin = Math.abs(result.homeScore - result.awayScore);
  let delta = wonGame ? 1 : -1;

  if (wonGame) {
    delta += Math.min(1, Math.round(scoreMargin / 4));
    if (opponent.prestige >= 50) {
      delta += 1;
    }
  } else if (scoreMargin >= 4) {
    delta -= 1;
  }

  if (row) {
    if (row.winPct >= 0.6) {
      delta += 1;
    } else if (row.winPct <= 0.4) {
      delta -= 1;
    }
    if (row.streak >= 3) {
      delta += 1;
    } else if (row.streak <= -3) {
      delta -= 1;
    }
  }

  if (teamId === game.homeTeamId) {
    const capacity = state.stadiums[team.stadiumId].capacity;
    const fillRate = result.attendance / Math.max(1, capacity);
    const priceGap = finance.ticketPrice - getTargetTicketPrice(team);
    if (fillRate >= 0.82) {
      delta += 1;
    } else if (fillRate <= 0.42) {
      delta -= 1;
    }
    if (priceGap >= 5 && fillRate < 0.6) {
      delta -= 1;
    }
    if (priceGap <= -2 && fillRate >= 0.72) {
      delta += 1;
    }
  }

  return Math.max(-3, Math.min(3, delta));
}

function refreshCommercialState(state: GameState, teamId: string) {
  const team = state.teams[teamId];
  const finance = state.finances[teamId];
  const row = getStandingRow(state, teamId);
  const stadium = state.stadiums[team.stadiumId];
  const attendanceShare = row ? row.averageAttendance / Math.max(1, stadium.capacity) : 0.4;
  const winPct = row?.winPct ?? 0.5;
  const marketingRatio = finance.marketingBudgetMonthly / Math.max(1, economyConfig.averageMarketingBudgetMonthly);
  const sponsorMultiplier = 0.55
    + ((team.marketSize / 100) * 0.45)
    + ((team.prestige / 100) * 0.18)
    + ((team.fanInterest / 100) * 0.25)
    + (attendanceShare * 0.25)
    + (winPct * 0.18)
    + (Math.min(1.4, marketingRatio) * 0.06);
  finance.sponsorRevenueMonthly = Math.round(Math.max(
    economyConfig.baseSponsorRevenueMonthly * 0.7,
    Math.min(economyConfig.baseSponsorRevenueMonthly * 1.85, economyConfig.baseSponsorRevenueMonthly * sponsorMultiplier),
  ));

  const merchandiseTarget = 10
    + (team.fanInterest * 0.45)
    + (team.prestige * 0.14)
    + (attendanceShare * 18)
    + (winPct * 8)
    + (Math.max(-10, team.morale - 50) * 0.08);
  finance.merchandiseStrength = clampRating((finance.merchandiseStrength * 0.55) + (merchandiseTarget * 0.45));
}

type InjuryCandidate = {
  playerId: string;
  teamId: string;
  role: "pitcher" | "hitter";
  workload: number;
  riskWeight: number;
};

function clampProbability(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function buildInjuryCandidates(state: GameState, game: ScheduledGame) {
  const result = game.result!;
  const candidates: InjuryCandidate[] = [];

  Object.values(result.boxScore.battingLines).forEach((line) => {
    const player = state.players[line.playerId];
    if (!player || !player.currentTeamId || player.status === "injured" || player.status === "retired" || player.status === "suspended") {
      return;
    }
    const plateAppearances = line.atBats + line.walks;
    if (plateAppearances === 0) {
      return;
    }
    const workload = plateAppearances + (line.stolenBases * 1.4) + (line.strikeouts * 0.25);
    const riskWeight = 1
      + (workload * 0.5)
      + (player.fatigue / 20)
      + (player.injuryProneness / 16)
      + (player.primaryPosition === "C" ? 0.9 : 0);
    candidates.push({ playerId: player.id, teamId: player.currentTeamId, role: "hitter", workload, riskWeight });
  });

  Object.values(result.boxScore.pitchingLines).forEach((line) => {
    const player = state.players[line.playerId];
    if (!player || !player.currentTeamId || player.status === "injured" || player.status === "retired" || player.status === "suspended") {
      return;
    }
    const workload = (line.pitchesThrown / 6)
      + (line.inningsPitched * 1.8)
      + ((line.hitsAllowed + line.walks + line.earnedRuns) * 0.8);
    const riskWeight = 1.5
      + workload
      + (player.fatigue / 14)
      + (player.injuryProneness / 14);
    candidates.push({ playerId: player.id, teamId: player.currentTeamId, role: "pitcher", workload, riskWeight });
  });

  return candidates;
}

function chooseInjuryCandidate(state: GameState, candidates: InjuryCandidate[]) {
  const ranked = [...candidates].sort((left, right) => right.riskWeight - left.riskWeight);
  const clearLeader = ranked[0];
  const runnerUp = ranked[1];
  if (clearLeader && clearLeader.riskWeight >= 18 && (!runnerUp || clearLeader.riskWeight >= runnerUp.riskWeight * 1.6)) {
    return clearLeader;
  }

  const totalWeight = candidates.reduce((sum, candidate) => sum + candidate.riskWeight, 0);
  if (totalWeight <= 0) {
    return undefined;
  }

  let roll = nextRoll(state) * totalWeight;
  for (const candidate of candidates) {
    roll -= candidate.riskWeight;
    if (roll <= 0) {
      return candidate;
    }
  }

  return candidates[candidates.length - 1];
}

function getInjuryChance(state: GameState, candidate: InjuryCandidate) {
  const player = state.players[candidate.playerId];
  const facilities = state.facilities[candidate.teamId];
  const medicalSupport = facilities?.medicalFacilityLevel ?? 1;
  const fatigueFactor = candidate.role === "pitcher" ? player.fatigue / 340 : player.fatigue / 620;
  const pronenessFactor = player.injuryProneness / (candidate.role === "pitcher" ? 400 : 700);
  const workloadFactor = candidate.workload / (candidate.role === "pitcher" ? 65 : 150);
  const preventionBonus = (medicalSupport - 1) * 0.012;
  const baseChance = simConfig.baseInjuryChance * (candidate.role === "pitcher" ? 2.1 : 1.45);
  return clampProbability(baseChance + fatigueFactor + pronenessFactor + workloadFactor - preventionBonus, 0.01, candidate.role === "pitcher" ? 0.5 : 0.26);
}

function getInjuryProfile(state: GameState, candidate: InjuryCandidate, severityRoll: number) {
  const player = state.players[candidate.playerId];
  const facilities = state.facilities[candidate.teamId];
  const medicalSupport = facilities?.medicalFacilityLevel ?? 1;
  const severityScore = severityRoll + (player.fatigue / 220) + (candidate.workload / (candidate.role === "pitcher" ? 95 : 180)) - ((medicalSupport - 1) * 0.04);
  const severity = severityScore > 1.02 ? "major" as const : severityScore > 0.66 ? "moderate" as const : "minor" as const;
  const baseWeeks = severity === "major" ? (candidate.role === "pitcher" ? 7 : 6) : severity === "moderate" ? (candidate.role === "pitcher" ? 4 : 3) : (candidate.role === "pitcher" ? 2 : 1);
  const extraWeeks = candidate.workload > (candidate.role === "pitcher" ? 22 : 8) ? 1 : 0;
  const gamesRemainingEstimate = Math.max(1, baseWeeks + extraWeeks - Math.max(0, medicalSupport - 1));
  const injuryType = candidate.role === "pitcher"
    ? (severity === "major" ? "Elbow inflammation" : severity === "moderate" ? "Shoulder strain" : "Forearm tightness")
    : (severity === "major" ? "Hamstring strain" : severity === "moderate" ? "Wrist sprain" : "Bruised shoulder");
  return { severity, gamesRemainingEstimate, injuryType };
}

function updatePlayerStats(state: GameState, game: ScheduledGame) {
  const result = game.result!;
  const homeWinner = result.winningTeamId === game.homeTeamId;
  const homeLineupIds = state.teams[game.homeTeamId].activeLineup.battingOrderPlayerIds;
  const awayLineupIds = state.teams[game.awayTeamId].activeLineup.battingOrderPlayerIds;
  const participants = new Set<string>([...homeLineupIds, ...awayLineupIds, ...Object.keys(result.boxScore.pitchingLines)]);

  participants.forEach((playerId) => {
    const player = state.players[playerId];
    player.seasonStats.games += 1;
    player.careerStats.games += 1;
    const wonGame = player.currentTeamId === result.winningTeamId;
    player.morale = Math.max(0, Math.min(100, player.morale + (wonGame ? 2 : -1)));
  });

  new Set([...homeLineupIds, ...awayLineupIds]).forEach((playerId) => {
    const player = state.players[playerId];
    const line = result.boxScore.battingLines[playerId];
    player.fatigue = clampFatigue(player.fatigue + getHitterFatigueCost(line));
  });

  Object.values(result.boxScore.battingLines).forEach((line) => {
    const player = state.players[line.playerId];
    player.seasonStats.atBats += line.atBats;
    player.seasonStats.runs += line.runs;
    player.seasonStats.hits += line.hits;
    player.seasonStats.runsBattedIn += line.rbi;
    player.seasonStats.walks += line.walks;
    player.seasonStats.strikeouts += line.strikeouts;
    player.seasonStats.doubles += line.doubles;
    player.seasonStats.triples += line.triples;
    player.seasonStats.homeRuns += line.homeRuns;
    player.seasonStats.stolenBases += line.stolenBases;
    player.careerStats.atBats += line.atBats;
    player.careerStats.runs += line.runs;
    player.careerStats.hits += line.hits;
    player.careerStats.runsBattedIn += line.rbi;
    player.careerStats.walks += line.walks;
    player.careerStats.strikeouts += line.strikeouts;
    player.careerStats.doubles += line.doubles;
    player.careerStats.triples += line.triples;
    player.careerStats.homeRuns += line.homeRuns;
    player.careerStats.stolenBases += line.stolenBases;
    recalculateBattingAverage(player);
  });

  Object.values(result.boxScore.pitchingLines).forEach((line) => {
    const player = state.players[line.playerId];
    player.fatigue = clampFatigue(player.fatigue + getPitcherFatigueCost(player, line));
    player.seasonStats.inningsPitched += line.inningsPitched;
    player.seasonStats.hitsAllowed += line.hitsAllowed;
    player.seasonStats.earnedRuns += line.earnedRuns;
    player.seasonStats.walksAllowed += line.walks;
    player.seasonStats.strikeoutsPitched += line.strikeouts;
    player.seasonStats.homeRunsAllowed += line.homeRunsAllowed;
    player.careerStats.inningsPitched += line.inningsPitched;
    player.careerStats.hitsAllowed += line.hitsAllowed;
    player.careerStats.earnedRuns += line.earnedRuns;
    player.careerStats.walksAllowed += line.walks;
    player.careerStats.strikeoutsPitched += line.strikeouts;
    player.careerStats.homeRunsAllowed += line.homeRunsAllowed;
    if (result.winningPitcherId === line.playerId) {
      player.seasonStats.wins += 1;
      player.careerStats.wins += 1;
    }
    if (result.losingPitcherId === line.playerId) {
      player.seasonStats.losses += 1;
      player.careerStats.losses += 1;
    }
  });

  state.teams[game.homeTeamId].morale = Math.max(0, Math.min(100, state.teams[game.homeTeamId].morale + (homeWinner ? 2 : -2)));
  state.teams[game.awayTeamId].morale = Math.max(0, Math.min(100, state.teams[game.awayTeamId].morale + (homeWinner ? -2 : 2)));
  state.teams[game.homeTeamId].fanInterest = clampRating(state.teams[game.homeTeamId].fanInterest + getFanInterestDelta(state, game, game.homeTeamId, game.awayTeamId, homeWinner));
  state.teams[game.awayTeamId].fanInterest = clampRating(state.teams[game.awayTeamId].fanInterest + getFanInterestDelta(state, game, game.awayTeamId, game.homeTeamId, !homeWinner));
}

function maybeCreateInjury(state: GameState, game: ScheduledGame) {
  const candidates = buildInjuryCandidates(state, game);
  if (candidates.length === 0) {
    return;
  }

  const candidate = chooseInjuryCandidate(state, candidates);
  if (!candidate) {
    return;
  }

  const player = state.players[candidate.playerId];
  const injuryChance = getInjuryChance(state, candidate);
  if (nextRoll(state) > injuryChance || player.status === "injured") {
    return;
  }

  const injuryId = `injury_${Object.keys(state.injuries).length + 1}`;
  const startDate = game.date;
  const profile = getInjuryProfile(state, candidate, nextRoll(state));
  const expectedReturnDate = addDays(startDate, profile.gamesRemainingEstimate * 7);
  state.injuries[injuryId] = {
    id: injuryId,
    playerId: candidate.playerId,
    injuryType: profile.injuryType,
    severity: profile.severity,
    startDate,
    expectedReturnDate,
    gamesRemainingEstimate: profile.gamesRemainingEstimate,
    isActive: true,
  };
  player.status = "injured";
  const team = state.teams[player.currentTeamId!];
  if (!team.injuredPlayerIds.includes(candidate.playerId)) {
    team.injuredPlayerIds.push(candidate.playerId);
  }
  state.mailbox.messages.unshift({
    id: `mail_injury_${injuryId}`,
    date: game.date,
    sender: "Training Staff",
    subject: `${player.fullName} injury update`,
    body: `${player.fullName} suffered ${profile.injuryType.toLowerCase()} after a heavy workload and is expected to miss ${profile.gamesRemainingEstimate} week(s).`,
    category: "injury",
    isRead: false,
    relatedEntityId: candidate.playerId,
  });
  state.mailbox.unreadCount = state.mailbox.messages.filter((message) => !message.isRead).length;
}

function updateStandings(state: GameState, game: ScheduledGame) {
  const result = game.result!;
  const standings = state.standings[game.leagueId];
  const homeRow = standings.rows.find((row) => row.teamId === game.homeTeamId)!;
  const awayRow = standings.rows.find((row) => row.teamId === game.awayTeamId)!;

  homeRow.runsFor += result.homeScore;
  homeRow.runsAgainst += result.awayScore;
  awayRow.runsFor += result.awayScore;
  awayRow.runsAgainst += result.homeScore;

  homeRow.runDifferential = homeRow.runsFor - homeRow.runsAgainst;
  awayRow.runDifferential = awayRow.runsFor - awayRow.runsAgainst;

  if (result.winningTeamId === game.homeTeamId) {
    homeRow.wins += 1;
    awayRow.losses += 1;
    homeRow.streak = homeRow.streak >= 0 ? homeRow.streak + 1 : 1;
    awayRow.streak = awayRow.streak <= 0 ? awayRow.streak - 1 : -1;
  } else {
    awayRow.wins += 1;
    homeRow.losses += 1;
    awayRow.streak = awayRow.streak >= 0 ? awayRow.streak + 1 : 1;
    homeRow.streak = homeRow.streak <= 0 ? homeRow.streak - 1 : -1;
  }

  homeRow.winPct = Number((homeRow.wins / Math.max(1, homeRow.wins + homeRow.losses)).toFixed(3));
  awayRow.winPct = Number((awayRow.wins / Math.max(1, awayRow.wins + awayRow.losses)).toFixed(3));
  const completedHomeGames = Object.values(state.schedule).filter((scheduledGame) => scheduledGame.status === "completed" && scheduledGame.homeTeamId === game.homeTeamId).length;
  homeRow.averageAttendance = completedHomeGames === 0
    ? result.attendance
    : Math.round(((homeRow.averageAttendance * Math.max(0, completedHomeGames - 1)) + result.attendance) / completedHomeGames);
  standings.lastUpdatedDate = game.date;
}


function recoverInjuries(state: GameState) {
  Object.values(state.injuries).forEach((injury) => {
    if (!injury.isActive) {
      return;
    }
    const player = state.players[injury.playerId];
    const teamId = player.currentTeamId;
    const medicalSupport = teamId ? (state.facilities[teamId]?.medicalFacilityLevel ?? 1) : 1;
    let recoveryStep = 1;

    if (injury.severity !== "major" && medicalSupport >= 2 && nextRoll(state) > 0.32) {
      recoveryStep += 1;
    }
    if (injury.severity === "minor" && medicalSupport >= 2 && player.fatigue <= 60 && nextRoll(state) > 0.45) {
      recoveryStep += 1;
    }
    if (injury.severity === "major") {
      recoveryStep = Math.min(recoveryStep, 1);
    }
    if (player.fatigue >= 82 && nextRoll(state) > 0.55) {
      recoveryStep = Math.max(1, recoveryStep - 1);
    }

    injury.gamesRemainingEstimate = Math.max(0, injury.gamesRemainingEstimate - recoveryStep);
    injury.expectedReturnDate = addDays(state.world.currentDate, injury.gamesRemainingEstimate * 7);
    if (injury.gamesRemainingEstimate === 0) {
      injury.isActive = false;
      player.status = "active";
      if (teamId) {
        const team = state.teams[teamId];
        team.injuredPlayerIds = team.injuredPlayerIds.filter((playerId) => playerId !== injury.playerId);
      }
    }
  });
}

function runWeeklyDevelopment(state: GameState) {
  Object.values(state.players).forEach((player) => {
    if (player.status === "retired") {
      return;
    }
    const developmentRoll = nextRoll(state);
    if (player.age <= 24 && developmentRoll > 0.7) {
      player.overall = Math.min(99, player.overall + 1);
    } else if (player.age >= 31 && developmentRoll > 0.82) {
      player.overall = Math.max(30, player.overall - 1);
    }
    player.fatigue = clampFatigue(player.fatigue - (player.ratings.pitching ? simConfig.weeklyRecovery + 4 : simConfig.weeklyRecovery + 2));
    player.development.lastWeeklyDevelopmentTick = state.world.currentDate;
  });
}

function sortStandings(rows: GameState["standings"][string]["rows"]) {
  return [...rows].sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    if (b.runDifferential !== a.runDifferential) return b.runDifferential - a.runDifferential;
    return b.runsFor - a.runsFor;
  });
}

function evaluatePromotion(state: GameState): PromotionStatus {
  const league = state.leagues[state.teams[state.world.userTeamId].leagueId];
  const standings = sortStandings(state.standings[league.id].rows);
  const userRow = standings.find((row) => row.teamId === state.world.userTeamId)!;
  const finalRank = standings.findIndex((row) => row.teamId === state.world.userTeamId) + 1;
  const finance = state.finances[state.world.userTeamId];
  const stadium = state.stadiums[state.teams[state.world.userTeamId].stadiumId];
  const qualifiedByRank = finalRank <= league.promotionSpots;
  const stadiumRequirementMet = stadium.capacity >= league.minStadiumCapacityForPromotion;
  const attendanceRequirementMet = userRow.averageAttendance >= league.minAverageAttendanceForPromotion;
  const cashRequirementMet = finance.currentCash >= league.minCashReserveForPromotion;
  const promoted = qualifiedByRank && stadiumRequirementMet && attendanceRequirementMet && cashRequirementMet;
  const summary = promoted
    ? "Promotion secured."
    : "Promotion missed due to standings or club requirements.";
  return { finalRank, qualifiedByRank, stadiumRequirementMet, attendanceRequirementMet, cashRequirementMet, promoted, summary };
}

function finalizeSeason(state: GameState) {
  const league = state.leagues[state.teams[state.world.userTeamId].leagueId];
  const sorted = sortStandings(state.standings[league.id].rows);
  const promotion = evaluatePromotion(state);
  const message = promotion.promoted
    ? "The board approved promotion after a strong first season."
    : "The season is complete, but the club fell short of promotion requirements.";
  state.world.currentPhase = "offseason";
  state.world.seasonStatus = "completed";
  state.story.seasonResultMessage = message;
  state.story.currentChapter = promotion.promoted ? "nextTierArrival" : "firstPromotionPush";
  state.story.objectives[state.story.activeObjectiveIds[0]].completed = promotion.promoted;
  state.story.objectives[state.story.activeObjectiveIds[0]].currentValue = promotion.promoted ? 1 : 0;
  if (promotion.promoted) {
    state.story.completedObjectiveIds = Array.from(new Set([...state.story.completedObjectiveIds, state.story.activeObjectiveIds[0]]));
  }
  state.seasonSummary = {
    championTeamId: sorted[0].teamId,
    finalStandings: sorted.map((row) => row.teamId),
    promotion,
    message,
  };
  state.mailbox.messages.unshift({
    id: `mail_season_${state.world.currentSeason}`,
    date: state.world.currentDate,
    sender: "Board of Directors",
    subject: "Season review",
    body: message,
    category: "story",
    isRead: false,
  });
  state.mailbox.unreadCount = state.mailbox.messages.filter((message) => !message.isRead).length;
}

function startNextSeason(state: GameState) {
  const nextSeason = state.world.currentSeason + 1;
  const seasonStartDate = addDays(state.world.currentDate, 7);

  const schedule: Record<string, ScheduledGame> = {};
  let gameCounter = 1;
  let maxWeeks = 0;

  Object.values(state.leagues).forEach((league) => {
    const weeks = generateRoundRobinWeeks(league.teamIds);
    maxWeeks = Math.max(maxWeeks, weeks.length);
    weeks.forEach((pairings, index) => {
      const week = index + 1;
      pairings.forEach(([homeTeamId, awayTeamId]) => {
        const id = `game_${nextSeason}_${String(gameCounter).padStart(4, "0")}`;
        schedule[id] = {
          id,
          leagueId: league.id,
          season: nextSeason,
          date: addDays(seasonStartDate, (week - 1) * 7),
          week,
          homeTeamId,
          awayTeamId,
          status: "scheduled",
          weather: "Clear",
        };
        gameCounter += 1;
      });
    });

    state.standings[league.id].rows = league.teamIds.map((teamId) => ({
      teamId,
      wins: 0,
      losses: 0,
      winPct: 0,
      runsFor: 0,
      runsAgainst: 0,
      runDifferential: 0,
      streak: 0,
      averageAttendance: 0,
    }));
    state.standings[league.id].lastUpdatedDate = seasonStartDate;
  });

  state.schedule = schedule;
  state.world.currentSeason = nextSeason;
  state.world.currentWeek = 1;
  state.world.currentDate = seasonStartDate;
  state.world.currentPhase = "regularSeason";
  state.world.weeksInSeason = maxWeeks;
  state.world.seasonStatus = "inProgress";
  state.seasonSummary = undefined;
  state.story.seasonResultMessage = undefined;

  Object.values(state.finances).forEach((finance) => {
    finance.lastMonthRevenueBreakdown = createRevenueBreakdown();
    finance.lastMonthExpenseBreakdown = createExpenseBreakdown();
    finance.seasonRevenueBreakdown = createRevenueBreakdown();
    finance.seasonExpenseBreakdown = createExpenseBreakdown();
  });

  Object.values(state.players).forEach((player) => {
    if (player.status !== "retired") {
      player.status = player.currentTeamId ? "active" : "freeAgent";
    }
    player.seasonStats = createEmptyStats();
    player.fatigue = clampFatigue(player.fatigue * 0.35);
  });

  Object.values(state.teams).forEach((team) => {
    team.injuredPlayerIds = [];
    team.rotation.nextStarterIndex = 0;
  });

  state.injuries = {};
  state.mailbox.messages.unshift({
    id: `mail_new_season_${nextSeason}`,
    date: seasonStartDate,
    sender: "League Commissioner",
    subject: `Season ${nextSeason} kickoff`,
    body: "A new season is underway. Promotion status from last year will not block your next campaign.",
    category: "league",
    isRead: false,
  });
  state.mailbox.unreadCount = state.mailbox.messages.filter((message) => !message.isRead).length;
}

function processFinances(state: GameState, game: ScheduledGame) {
  const result = game.result!;
  const homeFinance = state.finances[game.homeTeamId];
  const awayFinance = state.finances[game.awayTeamId];
  const homeTeam = state.teams[game.homeTeamId];
  const homeRow = getStandingRow(state, game.homeTeamId);
  const seriesGames = Math.max(1, economyConfig.gamesPerSeries ?? 1);
  const ticketRevenue = result.attendance * homeFinance.ticketPrice * seriesGames;
  const merchandiseSpendPerFan = 1.2
    + (homeFinance.merchandiseStrength / 45)
    + (homeTeam.fanInterest / 120)
    + ((homeRow?.winPct ?? 0.5) * 0.5);
  const merchandiseRevenue = Math.round(result.attendance * merchandiseSpendPerFan * seriesGames);
  homeFinance.lastMonthRevenueBreakdown.ticketSales += ticketRevenue;
  homeFinance.lastMonthRevenueBreakdown.merchandise += merchandiseRevenue;
  awayFinance.lastMonthExpenseBreakdown.travel += economyConfig.travelCostPerRoadGame * seriesGames;
}

function settleWeeklyLedger(state: GameState) {
  Object.keys(state.finances).forEach((teamId) => {
    refreshCommercialState(state, teamId);
    const finance = state.finances[teamId];
    finance.lastMonthRevenueBreakdown.sponsorships += Math.round(finance.sponsorRevenueMonthly / 4);
    finance.lastMonthExpenseBreakdown.payroll += Math.round(finance.payrollMonthly / 4);
    finance.lastMonthExpenseBreakdown.staff += Math.round(finance.staffCostsMonthly / 4);
    finance.lastMonthExpenseBreakdown.upkeep += Math.round(finance.facilityUpkeepMonthly / 4);
    finance.lastMonthExpenseBreakdown.scouting += Math.round(finance.scoutingBudgetMonthly / 4);
    finance.lastMonthExpenseBreakdown.marketing += Math.round(finance.marketingBudgetMonthly / 4);
    finance.lastMonthExpenseBreakdown.debtService += Math.round(finance.currentDebt * economyConfig.debtServiceRateWeekly);

    Object.entries(finance.lastMonthRevenueBreakdown).forEach(([key, value]) => {
      finance.seasonRevenueBreakdown[key as keyof typeof finance.seasonRevenueBreakdown] += value;
    });
    Object.entries(finance.lastMonthExpenseBreakdown).forEach(([key, value]) => {
      finance.seasonExpenseBreakdown[key as keyof typeof finance.seasonExpenseBreakdown] += value;
    });

    const totalRevenue = Object.values(finance.lastMonthRevenueBreakdown).reduce((sum, value) => sum + value, 0);
    const totalExpenses = Object.values(finance.lastMonthExpenseBreakdown).reduce((sum, value) => sum + value, 0);
    finance.currentCash += totalRevenue - totalExpenses;
    if (finance.currentCash < 0) {
      finance.currentDebt += Math.abs(finance.currentCash);
      finance.currentCash = 0;
    }
  });
  syncTeamFinances(state);
}

export function advanceWeek(input: GameState): GameState {
  const state = clone(input);
  if (state.world.seasonStatus === "completed") {
    if (state.seasonSummary?.promotion.promoted) {
      return state;
    }
    startNextSeason(state);
    return state;
  }

  Object.values(state.finances).forEach((finance) => {
    finance.lastMonthRevenueBreakdown = {
      ticketSales: 0,
      sponsorships: 0,
      merchandise: 0,
      playoffRevenue: 0,
      transferFees: 0,
      other: 0,
    };
    finance.lastMonthExpenseBreakdown = {
      payroll: 0,
      staff: 0,
      travel: 0,
      upkeep: 0,
      scouting: 0,
      marketing: 0,
      debtService: 0,
      other: 0,
    };
  });

  state.pendingActions.push({
    id: `pending_${state.pendingActions.length + 1}`,
    type: "ADVANCE_WEEK",
    createdAt: new Date().toISOString(),
    payload: { week: state.world.currentWeek },
    status: "processed",
  });

  recoverInjuries(state);
  Object.keys(state.teams).forEach((teamId) => reconcileTeam(state, teamId));

  const games = Object.values(state.schedule).filter((game) => game.week === state.world.currentWeek && game.status === "scheduled");

  for (const game of games) {
    const result = simulateGame(state, game);
    state.schedule[game.id].status = "completed";
    state.schedule[game.id].result = result;
    processFinances(state, game);
    updateStandings(state, state.schedule[game.id]);
    updatePlayerStats(state, state.schedule[game.id]);
    maybeCreateInjury(state, state.schedule[game.id]);
    state.teams[game.homeTeamId].rotation.nextStarterIndex = (state.teams[game.homeTeamId].rotation.nextStarterIndex + 1) % state.teams[game.homeTeamId].rotation.starterPlayerIds.length;
    state.teams[game.awayTeamId].rotation.nextStarterIndex = (state.teams[game.awayTeamId].rotation.nextStarterIndex + 1) % state.teams[game.awayTeamId].rotation.starterPlayerIds.length;
    state.eventLog.push({
      id: `event_${state.eventLog.length + 1}`,
      timestamp: new Date().toISOString(),
      actionType: "SIMULATE_GAME",
      actorTeamId: game.homeTeamId,
      payload: { gameId: game.id },
      summary: `${state.teams[game.awayTeamId].nickname} ${result.awayScore} at ${state.teams[game.homeTeamId].nickname} ${result.homeScore}`,
    });
  }

  runWeeklyDevelopment(state);
  Object.keys(state.teams).forEach((teamId) => reconcileTeam(state, teamId));
  settleWeeklyLedger(state);

  state.meta.updatedAt = new Date().toISOString();

  if (state.world.currentWeek >= state.world.weeksInSeason) {
    finalizeSeason(state);
  } else {
    state.world.currentWeek += 1;
    state.world.currentDate = addDays(state.world.currentDate, 7);
  }

  return state;
}







