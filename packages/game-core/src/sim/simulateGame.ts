import { simConfig } from "@baseball-sim/config";
import { GameResult, GameState, Player, ScheduledGame } from "../types/gameState";
import { nextSeededValue } from "../utils/rng";

function nextRoll(state: GameState) {
  const value = nextSeededValue(state.rng.seed, state.rng.step);
  state.rng.step += 1;
  return value;
}

function createBattingLine(playerId: string) {
  return {
    playerId,
    atBats: 0,
    runs: 0,
    hits: 0,
    rbi: 0,
    walks: 0,
    strikeouts: 0,
    doubles: 0,
    triples: 0,
    homeRuns: 0,
    stolenBases: 0,
  };
}

function createPitchingLine(playerId: string) {
  return {
    playerId,
    inningsPitched: 0,
    hitsAllowed: 0,
    earnedRuns: 0,
    walks: 0,
    strikeouts: 0,
    homeRunsAllowed: 0,
    pitchesThrown: 0,
  };
}

function batterScore(player: Player) {
  return (
    player.ratings.hitting.contact * simConfig.batterWeights.contact +
    player.ratings.hitting.power * simConfig.batterWeights.power +
    player.ratings.hitting.plateDiscipline * simConfig.batterWeights.plateDiscipline
  );
}

function pitcherScore(player: Player) {
  const pitching = player.ratings.pitching;
  if (!pitching) {
    return 35;
  }
  return (
    pitching.velocity * simConfig.pitcherWeights.velocity +
    pitching.control * simConfig.pitcherWeights.control +
    pitching.movement * simConfig.pitcherWeights.movement
  );
}

function defenseScore(players: Player[]) {
  const total = players.reduce((sum, player) => sum + player.ratings.defense.fielding + player.ratings.defense.range, 0);
  return total / Math.max(1, players.length * 2);
}

function resolvePlateAppearance(state: GameState, batter: Player, pitcher: Player, defenders: Player[]) {
  const defenseModifier = (defenseScore(defenders) - 50) * simConfig.defenseWeight;
  const stamina = pitcher.ratings.pitching?.stamina ?? 45;
  const fatiguePenalty = Math.max(0, pitcher.fatigue - (stamina * 0.6)) * 0.22;
  const adjusted = batterScore(batter) - (pitcherScore(pitcher) - fatiguePenalty) - defenseModifier + ((nextRoll(state) * 2 - 1) * simConfig.randomnessRange);
  const walkChance = batter.ratings.hitting.plateDiscipline * 0.4 - ((pitcher.ratings.pitching?.control ?? 40) * 0.3) + (nextRoll(state) * 10);

  if (walkChance > simConfig.walkThreshold) return "walk" as const;
  if (adjusted < -40) return "strikeout" as const;
  if (adjusted < -10) return "out" as const;
  if (adjusted < 6) return "single" as const;
  if (adjusted < 16) return "double" as const;
  if (adjusted < 24) return "triple" as const;
  return "homeRun" as const;
}

function moveRunnersForWalk(bases: Array<string | null>, batterId: string) {
  const scoredRunnerIds: string[] = [];

  for (let index = 2; index >= 0; index -= 1) {
    if (!bases[index]) {
      continue;
    }
    const destination = index + 1;
    if (destination >= 3) {
      scoredRunnerIds.push(bases[index]!);
      bases[index] = null;
      continue;
    }
    if (bases[destination]) {
      continue;
    }
    bases[destination] = bases[index];
    bases[index] = null;
  }

  bases[0] = batterId;

  return scoredRunnerIds;
}

function moveRunnersForHit(state: GameState, bases: Array<string | null>, batter: Player, hitType: "single" | "double" | "triple" | "homeRun") {
  const scoredRunnerIds: string[] = [];
  let advancementEvents = 0;

  if (hitType === "homeRun") {
    scoredRunnerIds.push(...bases.filter(Boolean) as string[], batter.id);
    bases[0] = null;
    bases[1] = null;
    bases[2] = null;
    return { scoredRunnerIds, advancementEvents: 3 };
  }

  const advance = hitType === "single" ? 1 : hitType === "double" ? 2 : 3;
  for (let index = 2; index >= 0; index -= 1) {
    const runnerId = bases[index];
    if (!runnerId) continue;
    const runner = state.players[runnerId];
    let destination = index + advance;
    if (hitType === "single" && index === 0 && runner.ratings.speed.speed > 55 && nextRoll(state) > 0.5) {
      destination += 1;
      advancementEvents += 1;
    }
    if (destination >= 3) {
      scoredRunnerIds.push(runnerId);
    } else {
      bases[destination] = runnerId;
    }
    bases[index] = null;
  }

  if (advance >= 3) {
    scoredRunnerIds.push(batter.id);
  } else {
    bases[advance - 1] = batter.id;
  }

  return { scoredRunnerIds, advancementEvents };
}

function maybeStealBase(state: GameState, bases: Array<string | null>, battingLines: Record<string, ReturnType<typeof createBattingLine>>) {
  const runnerId = bases[0];
  if (!runnerId || bases[1]) {
    return;
  }
  const runner = state.players[runnerId];
  const attemptChance = ((runner.ratings.speed.stealing + runner.ratings.speed.baserunningIQ) / 200) * 0.14;
  if (nextRoll(state) > attemptChance) {
    return;
  }

  const successRate = 0.42 + (runner.ratings.speed.speed / 200) + (runner.ratings.speed.stealing / 250);
  if (nextRoll(state) <= successRate) {
    bases[0] = null;
    bases[1] = runnerId;
    const line = battingLines[runnerId] ?? (battingLines[runnerId] = createBattingLine(runnerId));
    line.stolenBases += 1;
  }
}

function incrementPitchingInnings(line: ReturnType<typeof createPitchingLine>, outs: number) {
  line.inningsPitched = Math.round((((line.inningsPitched * 3) + outs) / 3) * 10) / 10;
}

function simulateHalfInning(
  state: GameState,
  battingOrder: string[],
  battingIndex: { value: number },
  pitcher: Player,
  defenders: Player[],
  battingLines: Record<string, ReturnType<typeof createBattingLine>>,
  pitchingLine: ReturnType<typeof createPitchingLine>,
) {
  const bases: Array<string | null> = [null, null, null];
  let outs = 0;
  let runs = 0;
  let advancementEvents = 0;
  let plateAppearances = 0;
  let hits = 0;
  let walks = 0;
  let strikeouts = 0;

  while (outs < 3 && plateAppearances < 32) {
    const batterId = battingOrder[battingIndex.value % battingOrder.length];
    battingIndex.value += 1;
    const batter = state.players[batterId];
    const line = battingLines[batterId] ?? (battingLines[batterId] = createBattingLine(batterId));
    const outcome = resolvePlateAppearance(state, batter, pitcher, defenders);
    pitchingLine.pitchesThrown += 4;
    plateAppearances += 1;

    if (outcome === "walk") {
      line.walks += 1;
      walks += 1;
      pitchingLine.walks += 1;
      const scoredRunnerIds = moveRunnersForWalk(bases, batterId);
      line.rbi += scoredRunnerIds.length;
      runs += scoredRunnerIds.length;
      scoredRunnerIds.forEach((runnerId) => {
        const runnerLine = battingLines[runnerId] ?? (battingLines[runnerId] = createBattingLine(runnerId));
        runnerLine.runs += 1;
      });
      maybeStealBase(state, bases, battingLines);
      continue;
    }

    line.atBats += 1;

    if (outcome === "strikeout") {
      outs += 1;
      line.strikeouts += 1;
      pitchingLine.strikeouts += 1;
      strikeouts += 1;
      continue;
    }

    if (outcome === "out") {
      outs += 1;
      continue;
    }

    hits += 1;
    line.hits += 1;
    pitchingLine.hitsAllowed += 1;
    const result = moveRunnersForHit(state, bases, batter, outcome);
    runs += result.scoredRunnerIds.length;
    advancementEvents += result.advancementEvents;
    line.rbi += result.scoredRunnerIds.length;
    result.scoredRunnerIds.forEach((runnerId) => {
      const runnerLine = battingLines[runnerId] ?? (battingLines[runnerId] = createBattingLine(runnerId));
      runnerLine.runs += 1;
    });

    if (outcome === "double") {
      line.doubles += 1;
    } else if (outcome === "triple") {
      line.triples += 1;
    } else if (outcome === "homeRun") {
      line.homeRuns += 1;
      pitchingLine.homeRunsAllowed += 1;
    }

    maybeStealBase(state, bases, battingLines);
  }

  if (outs < 3) {
    outs = 3;
  }

  incrementPitchingInnings(pitchingLine, 3);
  pitchingLine.earnedRuns += runs;

  return { runs, plateAppearances, hits, walks, strikeouts, advancementEvents };
}

export function simulateGame(state: GameState, game: ScheduledGame): GameResult {
  const homeTeam = state.teams[game.homeTeamId];
  const awayTeam = state.teams[game.awayTeamId];
  const homeStarterId = homeTeam.rotation.starterPlayerIds[homeTeam.rotation.nextStarterIndex % homeTeam.rotation.starterPlayerIds.length];
  const awayStarterId = awayTeam.rotation.starterPlayerIds[awayTeam.rotation.nextStarterIndex % awayTeam.rotation.starterPlayerIds.length];
  const homeStarter = state.players[homeStarterId];
  const awayStarter = state.players[awayStarterId];
  const homeBattingIndex = { value: 0 };
  const awayBattingIndex = { value: 0 };
  const battingLines: Record<string, ReturnType<typeof createBattingLine>> = {};
  const pitchingLines: Record<string, ReturnType<typeof createPitchingLine>> = {
    [homeStarterId]: createPitchingLine(homeStarterId),
    [awayStarterId]: createPitchingLine(awayStarterId),
  };

  let homeScore = 0;
  let awayScore = 0;
  let totalPlateAppearances = 0;
  let totalHits = 0;
  let totalWalks = 0;
  let totalStrikeouts = 0;
  let runnerAdvancementEvents = 0;
  let inningsPlayed = 9;

  for (let inning = 1; inning <= 15; inning += 1) {
    inningsPlayed = inning;
    const awayHalf = simulateHalfInning(
      state,
      awayTeam.activeLineup.battingOrderPlayerIds,
      awayBattingIndex,
      homeStarter,
      homeTeam.activeLineup.battingOrderPlayerIds.map((playerId) => state.players[playerId]),
      battingLines,
      pitchingLines[homeStarterId],
    );
    awayScore += awayHalf.runs;
    totalPlateAppearances += awayHalf.plateAppearances;
    totalHits += awayHalf.hits;
    totalWalks += awayHalf.walks;
    totalStrikeouts += awayHalf.strikeouts;
    runnerAdvancementEvents += awayHalf.advancementEvents;

    if (inning >= 9 && homeScore > awayScore) {
      break;
    }

    const homeHalf = simulateHalfInning(
      state,
      homeTeam.activeLineup.battingOrderPlayerIds,
      homeBattingIndex,
      awayStarter,
      awayTeam.activeLineup.battingOrderPlayerIds.map((playerId) => state.players[playerId]),
      battingLines,
      pitchingLines[awayStarterId],
    );
    homeScore += homeHalf.runs;
    totalPlateAppearances += homeHalf.plateAppearances;
    totalHits += homeHalf.hits;
    totalWalks += homeHalf.walks;
    totalStrikeouts += homeHalf.strikeouts;
    runnerAdvancementEvents += homeHalf.advancementEvents;

    if (inning >= 9 && homeScore !== awayScore) {
      break;
    }
  }

  const notableEvents: string[] = [];
  if (homeScore === awayScore) {
    if (nextRoll(state) >= 0.5) {
      homeScore += 1;
    } else {
      awayScore += 1;
    }
    notableEvents.push("The game needed an extra-inning tiebreak to produce a winner.");
  }

  const homeFinance = state.finances[game.homeTeamId];
  const homeStandings = state.standings[game.leagueId].rows.find((row) => row.teamId === game.homeTeamId);
  const attendanceBase = state.teams[game.homeTeamId].fanInterest / 100;
  const pricePenalty = Math.max(0.7, 1 - ((homeFinance.ticketPrice - 12) * 0.03));
  const momentumBoost = homeStandings ? 1 + (homeStandings.winPct * 0.15) : 1;
  const attendance = Math.max(
    250,
    Math.min(
      state.stadiums[homeTeam.stadiumId].capacity,
      Math.round(state.stadiums[homeTeam.stadiumId].capacity * attendanceBase * pricePenalty * momentumBoost),
    ),
  );

  const winningTeamId = homeScore > awayScore ? game.homeTeamId : game.awayTeamId;
  const losingTeamId = winningTeamId === game.homeTeamId ? game.awayTeamId : game.homeTeamId;
  const homeHomeRuns = Object.values(battingLines).filter((line) => line.homeRuns > 0 && homeTeam.rosterPlayerIds.includes(line.playerId));
  const awayHomeRuns = Object.values(battingLines).filter((line) => line.homeRuns > 0 && awayTeam.rosterPlayerIds.includes(line.playerId));
  if (homeHomeRuns.length > 0 || awayHomeRuns.length > 0) {
    notableEvents.push("The long ball decided key moments.");
  }
  if (Math.abs(homeScore - awayScore) >= 5) {
    notableEvents.push("One club pulled away late.");
  }

  return {
    homeScore,
    awayScore,
    inningsPlayed,
    winningTeamId,
    losingTeamId,
    winningPitcherId: winningTeamId === game.homeTeamId ? homeStarterId : awayStarterId,
    losingPitcherId: losingTeamId === game.homeTeamId ? homeStarterId : awayStarterId,
    attendance,
    notableEvents,
    boxScore: {
      battingLines,
      pitchingLines,
      errorsByTeam: {
        [game.homeTeamId]: nextRoll(state) > 0.88 ? 1 : 0,
        [game.awayTeamId]: nextRoll(state) > 0.88 ? 1 : 0,
      },
    },
    simSummary: {
      randomSeedUsed: state.rng.seed,
      totalPlateAppearances,
      totalHits,
      totalWalks,
      totalStrikeouts,
      runnerAdvancementEvents,
      injuryEvents: 0,
    },
  };
}
