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
    player.fatigue = Math.min(100, player.fatigue + (player.ratings.pitching ? simConfig.fatigueIncreasePitchers : simConfig.fatigueIncreaseHitters));
    const wonGame = player.currentTeamId === result.winningTeamId;
    player.morale = Math.max(0, Math.min(100, player.morale + (wonGame ? 2 : -1)));
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
  });

  Object.values(result.boxScore.pitchingLines).forEach((line) => {
    const player = state.players[line.playerId];
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
  state.teams[game.homeTeamId].fanInterest = Math.max(10, Math.min(100, state.teams[game.homeTeamId].fanInterest + (homeWinner ? 1 : -1)));
  state.teams[game.awayTeamId].fanInterest = Math.max(10, Math.min(100, state.teams[game.awayTeamId].fanInterest + (homeWinner ? -1 : 1)));
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

function maybeCreateInjury(state: GameState, game: ScheduledGame) {
  const participants = [...state.teams[game.homeTeamId].activeLineup.battingOrderPlayerIds, ...state.teams[game.awayTeamId].activeLineup.battingOrderPlayerIds];
  const injuredPlayerId = participants[Math.floor(nextRoll(state) * participants.length)];
  const player = state.players[injuredPlayerId];
  const injuryChance = simConfig.baseInjuryChance + (player.fatigue / 1000) + (player.injuryProneness / 4000);
  if (nextRoll(state) > injuryChance || player.status === "injured") {
    return;
  }

  const severityRoll = nextRoll(state);
  const severity = severityRoll > 0.9 ? "major" : severityRoll > 0.6 ? "moderate" : "minor";
  const gamesRemainingEstimate = severity === "major" ? 6 : severity === "moderate" ? 3 : 1;
  const injuryId = `injury_${Object.keys(state.injuries).length + 1}`;
  const startDate = game.date;
  const expectedReturnDate = addDays(startDate, gamesRemainingEstimate * 7);
  state.injuries[injuryId] = {
    id: injuryId,
    playerId: injuredPlayerId,
    injuryType: severity === "major" ? "Hamstring strain" : severity === "moderate" ? "Wrist sprain" : "Bruised shoulder",
    severity,
    startDate,
    expectedReturnDate,
    gamesRemainingEstimate,
    isActive: true,
  };
  player.status = "injured";
  const team = state.teams[player.currentTeamId!];
  if (!team.injuredPlayerIds.includes(injuredPlayerId)) {
    team.injuredPlayerIds.push(injuredPlayerId);
  }
  state.mailbox.messages.unshift({
    id: `mail_injury_${injuryId}`,
    date: game.date,
    sender: "Training Staff",
    subject: `${player.fullName} injury update`,
    body: `${player.fullName} suffered a ${state.injuries[injuryId].injuryType} and is expected to miss ${gamesRemainingEstimate} week(s).`,
    category: "injury",
    isRead: false,
    relatedEntityId: injuredPlayerId,
  });
  state.mailbox.unreadCount = state.mailbox.messages.filter((message) => !message.isRead).length;
}

function recoverInjuries(state: GameState) {
  Object.values(state.injuries).forEach((injury) => {
    if (!injury.isActive) {
      return;
    }
    injury.gamesRemainingEstimate = Math.max(0, injury.gamesRemainingEstimate - 1);
    if (injury.gamesRemainingEstimate === 0) {
      injury.isActive = false;
      const player = state.players[injury.playerId];
      player.status = "active";
      if (player.currentTeamId) {
        const team = state.teams[player.currentTeamId];
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
    player.fatigue = Math.max(0, player.fatigue - simConfig.weeklyRecovery);
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

function processFinances(state: GameState, game: ScheduledGame) {
  const result = game.result!;
  const homeFinance = state.finances[game.homeTeamId];
  const awayFinance = state.finances[game.awayTeamId];
  const ticketRevenue = result.attendance * homeFinance.ticketPrice;
  const merchandiseRevenue = Math.round(result.attendance * (homeFinance.merchandiseStrength / 100) * 3);
  homeFinance.lastMonthRevenueBreakdown.ticketSales += ticketRevenue;
  homeFinance.lastMonthRevenueBreakdown.merchandise += merchandiseRevenue;
  awayFinance.lastMonthExpenseBreakdown.travel += economyConfig.travelCostPerRoadGame;
}

function settleWeeklyLedger(state: GameState) {
  Object.values(state.finances).forEach((finance) => {
    finance.lastMonthRevenueBreakdown.sponsorships += Math.round(finance.sponsorRevenueMonthly / 4);
    finance.lastMonthExpenseBreakdown.payroll += Math.round(finance.payrollMonthly / 4);
    finance.lastMonthExpenseBreakdown.staff += Math.round(finance.staffCostsMonthly / 4);
    finance.lastMonthExpenseBreakdown.upkeep += Math.round(finance.facilityUpkeepMonthly / 4);
    finance.lastMonthExpenseBreakdown.scouting += Math.round(finance.scoutingBudgetMonthly / 4);
    finance.lastMonthExpenseBreakdown.marketing += Math.round(finance.marketingBudgetMonthly / 4);
    finance.lastMonthExpenseBreakdown.debtService += Math.round(finance.currentDebt * economyConfig.debtServiceRateWeekly);

    const totalRevenue = Object.values(finance.lastMonthRevenueBreakdown).reduce((sum, value) => sum + value, 0);
    const totalExpenses = Object.values(finance.lastMonthExpenseBreakdown).reduce((sum, value) => sum + value, 0);
    finance.currentCash += totalRevenue - totalExpenses;
    finance.currentDebt += finance.lastMonthExpenseBreakdown.debtService > 0 ? 0 : 0;
  });
  syncTeamFinances(state);
}

export function advanceWeek(input: GameState): GameState {
  const state = clone(input);
  if (state.world.seasonStatus === "completed") {
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
