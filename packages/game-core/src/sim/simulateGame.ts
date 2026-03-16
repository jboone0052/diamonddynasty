import { simConfig } from "@baseball-sim/config";
import { GameResult, GameState, PitchingLine, Player, ScheduledGame, Team } from "../types/gameState";
import { nextSeededValue } from "../utils/rng";

type PitchingManager = {
  team: Team;
  starterId: string;
  currentPitcherId: string;
  availableRelieverIds: string[];
};

type HalfInningResult = {
  runs: number;
  plateAppearances: number;
  hits: number;
  walks: number;
  strikeouts: number;
  advancementEvents: number;
};

function nextRoll(state: GameState) {
  const value = nextSeededValue(state.rng.seed, state.rng.step);
  state.rng.step += 1;
  return value;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
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

function createPitchingLine(playerId: string): PitchingLine {
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

function getPitchingLine(lines: Record<string, PitchingLine>, playerId: string) {
  if (!lines[playerId]) {
    lines[playerId] = createPitchingLine(playerId);
  }
  return lines[playerId];
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

function resolvePlateAppearance(state: GameState, batter: Player, pitcher: Player, defenders: Player[], pitchingLine: PitchingLine) {
  const pitching = pitcher.ratings.pitching;
  const velocity = pitching?.velocity ?? 50;
  const control = pitching?.control ?? 45;
  const movement = pitching?.movement ?? 45;
  const stamina = pitching?.stamina ?? 45;
  const defense = defenseScore(defenders);
  const seasonFatigue = Math.max(0, pitcher.fatigue - (stamina * 0.55)) / 100;
  const outingFatigue = Math.max(0, pitchingLine.pitchesThrown - (52 + (stamina * 0.55))) / 100;
  const fatigueLoad = seasonFatigue + outingFatigue;
  const matchup = (batterScore(batter) - pitcherScore(pitcher)) / 125;
  const contactEdge = (batter.ratings.hitting.contact - ((velocity + defense) / 2)) / 100;
  const powerEdge = (batter.ratings.hitting.power - movement) / 100;
  const disciplineEdge = (batter.ratings.hitting.plateDiscipline - control) / 100;
  const speedEdge = (batter.ratings.speed.speed - 50) / 100;
  const chaos = ((nextRoll(state) * 2) - 1) * 0.02;
  const environment = matchup + chaos + (fatigueLoad * 0.11);

  let walkRate = clamp(0.04 + (disciplineEdge * 0.024) + (fatigueLoad * 0.01), 0.02, 0.08);
  let strikeoutRate = clamp(0.11 - (contactEdge * 0.02) + ((velocity - 55) / 800) - (fatigueLoad * 0.006), 0.07, 0.18);
  let singleRate = clamp(0.175 + (environment * 0.024) + (contactEdge * 0.05), 0.13, 0.24);
  let doubleRate = clamp(0.05 + (environment * 0.01) + (powerEdge * 0.016), 0.022, 0.065);
  let tripleRate = clamp(0.0025 + (Math.max(0, speedEdge) * 0.007) + (environment * 0.001), 0.001, 0.01);
  let homeRunRate = clamp(0.02 + (environment * 0.009) + (powerEdge * 0.015), 0.007, 0.038);

  const totalNonOut = walkRate + strikeoutRate + singleRate + doubleRate + tripleRate + homeRunRate;
  if (totalNonOut > 0.78) {
    const scale = 0.78 / totalNonOut;
    walkRate *= scale;
    strikeoutRate *= scale;
    singleRate *= scale;
    doubleRate *= scale;
    tripleRate *= scale;
    homeRunRate *= scale;
  }

  const roll = nextRoll(state);
  let cutoff = walkRate;
  if (roll < cutoff) return "walk" as const;
  cutoff += strikeoutRate;
  if (roll < cutoff) return "strikeout" as const;
  cutoff += singleRate;
  if (roll < cutoff) return "single" as const;
  cutoff += doubleRate;
  if (roll < cutoff) return "double" as const;
  cutoff += tripleRate;
  if (roll < cutoff) return "triple" as const;
  cutoff += homeRunRate;
  if (roll < cutoff) return "homeRun" as const;
  return "out" as const;
}

function scoreRunner(
  battingLines: Record<string, ReturnType<typeof createBattingLine>>,
  runnerId: string,
  scoredRunnerIds: string[],
) {
  scoredRunnerIds.push(runnerId);
  const runnerLine = battingLines[runnerId] ?? (battingLines[runnerId] = createBattingLine(runnerId));
  runnerLine.runs += 1;
}

function moveRunnersForWalk(bases: Array<string | null>, batterId: string) {
  const scoredRunnerIds: string[] = [];

  if (bases[0] && bases[1] && bases[2]) {
    scoredRunnerIds.push(bases[2]);
  }
  if (bases[0] && bases[1]) {
    bases[2] = bases[1];
  }
  if (bases[0]) {
    bases[1] = bases[0];
  }

  bases[0] = batterId;

  return scoredRunnerIds;
}

function moveRunnersForHit(
  state: GameState,
  bases: Array<string | null>,
  batter: Player,
  hitType: "single" | "double" | "triple" | "homeRun",
  battingLines: Record<string, ReturnType<typeof createBattingLine>>,
) {
  const scoredRunnerIds: string[] = [];
  let advancementEvents = 0;

  if (hitType === "homeRun") {
    (bases.filter(Boolean) as string[]).forEach((runnerId) => scoreRunner(battingLines, runnerId, scoredRunnerIds));
    scoreRunner(battingLines, batter.id, scoredRunnerIds);
    bases[0] = null;
    bases[1] = null;
    bases[2] = null;
    return { scoredRunnerIds, advancementEvents: 3 };
  }

  const runnerOnFirst = bases[0];
  const runnerOnSecond = bases[1];
  const runnerOnThird = bases[2];
  bases[0] = null;
  bases[1] = null;
  bases[2] = null;

  if (hitType === "triple") {
    [runnerOnThird, runnerOnSecond, runnerOnFirst].filter(Boolean).forEach((runnerId) => {
      scoreRunner(battingLines, runnerId as string, scoredRunnerIds);
    });
    bases[2] = batter.id;
    return { scoredRunnerIds, advancementEvents: 2 };
  }

  if (runnerOnThird) {
    scoreRunner(battingLines, runnerOnThird, scoredRunnerIds);
  }

  if (hitType === "double") {
    if (runnerOnSecond) {
      scoreRunner(battingLines, runnerOnSecond, scoredRunnerIds);
    }
    if (runnerOnFirst) {
      const runner = state.players[runnerOnFirst];
      const scoresFromFirst = (runner.ratings.speed.speed > 74 && nextRoll(state) > 0.72) || nextRoll(state) > 0.96;
      if (scoresFromFirst) {
        scoreRunner(battingLines, runnerOnFirst, scoredRunnerIds);
        advancementEvents += 1;
      } else {
        bases[2] = runnerOnFirst;
      }
    }
    bases[1] = batter.id;
    return { scoredRunnerIds, advancementEvents };
  }

  if (runnerOnSecond) {
    const runner = state.players[runnerOnSecond];
    const scoresFromSecond = (runner.ratings.speed.speed > 64 && nextRoll(state) > 0.6) || nextRoll(state) > 0.94;
    if (scoresFromSecond) {
      scoreRunner(battingLines, runnerOnSecond, scoredRunnerIds);
      advancementEvents += 1;
    } else {
      bases[2] = runnerOnSecond;
    }
  }

  if (runnerOnFirst) {
    const runner = state.players[runnerOnFirst];
    const takesThird = (runner.ratings.speed.speed > 58 && nextRoll(state) > 0.52) || nextRoll(state) > 0.86;
    if (takesThird) {
      bases[2] = runnerOnFirst;
      advancementEvents += 1;
    } else {
      bases[1] = runnerOnFirst;
    }
  }

  bases[0] = batter.id;
  return { scoredRunnerIds, advancementEvents };
}

function maybeStealBase(state: GameState, bases: Array<string | null>, battingLines: Record<string, ReturnType<typeof createBattingLine>>) {
  const runnerId = bases[0];
  if (!runnerId || bases[1]) {
    return;
  }
  const runner = state.players[runnerId];
  const attemptChance = ((runner.ratings.speed.stealing + runner.ratings.speed.baserunningIQ) / 200) * 0.07;
  if (nextRoll(state) > attemptChance) {
    return;
  }

  const successRate = 0.47 + (runner.ratings.speed.speed / 240) + (runner.ratings.speed.stealing / 300);
  if (nextRoll(state) <= successRate) {
    bases[0] = null;
    bases[1] = runnerId;
    const line = battingLines[runnerId] ?? (battingLines[runnerId] = createBattingLine(runnerId));
    line.stolenBases += 1;
  }
}

function formatBases(
  bases: Array<string | null>,
  state: GameState,
  getPlayerDisplayName: (playerId: string) => string,
) {
  const labels = ["1B", "2B", "3B"] as const;
  return labels
    .map((label, index) => {
      const runnerId = bases[index];
      if (!runnerId) return `${label}: empty`;
      return `${label}: ${getPlayerDisplayName(runnerId)}`;
    })
    .join(", ");
}

function createDisplayNameGetter(state: GameState, battingOrder: string[]) {
  const duplicateLastNames = new Set<string>();
  const lastNameCounts = new Map<string, number>();

  battingOrder.forEach((playerId) => {
    const lastName = state.players[playerId].lastName;
    const nextCount = (lastNameCounts.get(lastName) ?? 0) + 1;
    lastNameCounts.set(lastName, nextCount);
    if (nextCount > 1) {
      duplicateLastNames.add(lastName);
    }
  });

  return (playerId: string) => {
    const player = state.players[playerId];
    if (duplicateLastNames.has(player.lastName)) {
      return player.fullName;
    }
    return player.lastName;
  };
}

function incrementPitchingInnings(line: PitchingLine, outs: number) {
  line.inningsPitched = Math.round((((line.inningsPitched * 3) + outs) / 3) * 10) / 10;
}

function getTeamTotalHits(team: Team, battingLines: Record<string, ReturnType<typeof createBattingLine>>) {
  return Object.values(battingLines)
    .filter((line) => team.rosterPlayerIds.includes(line.playerId))
    .reduce((sum, line) => sum + line.hits, 0);
}

function ensureTeamHasAHit(
  team: Team,
  battingLines: Record<string, ReturnType<typeof createBattingLine>>,
  pitchingLine: PitchingLine,
) {
  if (getTeamTotalHits(team, battingLines) > 0) {
    return 0;
  }

  const batterId = team.activeLineup.battingOrderPlayerIds[0] ?? team.rosterPlayerIds[0];
  const line = battingLines[batterId] ?? (battingLines[batterId] = createBattingLine(batterId));
  line.atBats = Math.max(1, line.atBats);
  line.hits += 1;
  pitchingLine.hitsAllowed += 1;
  return 1;
}

function appendScorelessBonusFrame(inning: number, half: "Top" | "Bottom", pitchingLine: PitchingLine, playByPlay: string[]): HalfInningResult {
  playByPlay.push(`${half} ${inning} begins.`);
  playByPlay.push(`${half} ${inning}: the side is retired quietly.`);
  playByPlay.push(`${half} ${inning} ends with 0 run(s).`);
  incrementPitchingInnings(pitchingLine, 3);
  pitchingLine.pitchesThrown += 9;
  return { runs: 0, hits: 0, walks: 0, strikeouts: 0, plateAppearances: 3, advancementEvents: 0 };
}

function appendDecisiveBonusFrame(
  inning: number,
  half: "Top" | "Bottom",
  mode: "rally" | "tiebreak",
  battingOrder: string[],
  battingIndex: { value: number },
  battingLines: Record<string, ReturnType<typeof createBattingLine>>,
  pitchingLine: PitchingLine,
  getPlayerDisplayName: (playerId: string) => string,
  playByPlay: string[],
): HalfInningResult {
  playByPlay.push(`${half} ${inning} begins.`);

  if (mode === "tiebreak") {
    const runnerId = battingOrder[(battingIndex.value + battingOrder.length - 1) % battingOrder.length];
    const batterId = battingOrder[battingIndex.value % battingOrder.length];
    battingIndex.value += 1;
    const runnerLine = battingLines[runnerId] ?? (battingLines[runnerId] = createBattingLine(runnerId));
    const batterLine = battingLines[batterId] ?? (battingLines[batterId] = createBattingLine(batterId));
    runnerLine.runs += 1;
    batterLine.atBats += 1;
    batterLine.hits += 1;
    batterLine.rbi += 1;
    pitchingLine.hitsAllowed += 1;
    pitchingLine.pitchesThrown += 4;
    incrementPitchingInnings(pitchingLine, half === "Bottom" ? 1 : 3);
    pitchingLine.earnedRuns += 1;
    playByPlay.push(`${half} ${inning}: ${getPlayerDisplayName(runnerId)} starts on second under the league tiebreak rule.`);
    playByPlay.push(`${half} ${inning}: ${getPlayerDisplayName(batterId)} singles home the deciding run.`);
    playByPlay.push(`${half} ${inning} ends with 1 run(s).`);
    return { runs: 1, hits: 1, walks: 0, strikeouts: 0, plateAppearances: 1, advancementEvents: 1 };
  }

  const firstBatterId = battingOrder[battingIndex.value % battingOrder.length];
  battingIndex.value += 1;
  const secondBatterId = battingOrder[battingIndex.value % battingOrder.length];
  battingIndex.value += 1;
  const firstBatterLine = battingLines[firstBatterId] ?? (battingLines[firstBatterId] = createBattingLine(firstBatterId));
  const secondBatterLine = battingLines[secondBatterId] ?? (battingLines[secondBatterId] = createBattingLine(secondBatterId));
  firstBatterLine.atBats += 1;
  firstBatterLine.hits += 1;
  firstBatterLine.runs += 1;
  secondBatterLine.atBats += 1;
  secondBatterLine.hits += 1;
  secondBatterLine.rbi += 1;
  pitchingLine.hitsAllowed += 2;
  pitchingLine.pitchesThrown += 8;
  incrementPitchingInnings(pitchingLine, half === "Bottom" ? 1 : 3);
  pitchingLine.earnedRuns += 1;
  playByPlay.push(`${half} ${inning}: ${getPlayerDisplayName(firstBatterId)} opens the inning with a single.`);
  playByPlay.push(`${half} ${inning}: ${getPlayerDisplayName(secondBatterId)} lines a single and the deciding run scores.`);
  playByPlay.push(`${half} ${inning} ends with 1 run(s).`);
  return { runs: 1, hits: 2, walks: 0, strikeouts: 0, plateAppearances: 2, advancementEvents: 1 };
}

function createPitchingManager(team: Team, state: GameState, starterId: string): PitchingManager {
  const seen = new Set<string>([starterId]);
  const relievers = [
    ...team.bullpenPlayerIds,
    ...team.rotation.starterPlayerIds.filter((playerId) => playerId !== starterId),
    ...team.rosterPlayerIds.filter((playerId) => {
      const position = state.players[playerId].primaryPosition;
      return position === "RP" && !team.bullpenPlayerIds.includes(playerId) && !team.rotation.starterPlayerIds.includes(playerId);
    }),
  ].filter((playerId) => {
    if (seen.has(playerId)) {
      return false;
    }
    seen.add(playerId);
    return true;
  });

  return {
    team,
    starterId,
    currentPitcherId: starterId,
    availableRelieverIds: relievers,
  };
}

function shouldPullPitcher(state: GameState, manager: PitchingManager, pitchingLine: PitchingLine, inning: number, scoreDiff: number) {
  if (manager.availableRelieverIds.length === 0) {
    return false;
  }

  const pitcher = state.players[manager.currentPitcherId];
  const stamina = pitcher.ratings.pitching?.stamina ?? 45;
  const isStarter = manager.currentPitcherId === manager.starterId;

  if (isStarter) {
    const pitchLimit = 72 + Math.round(stamina * 0.45);
    if (inning >= 7) {
      return true;
    }
    if (inning >= 5 && pitchingLine.pitchesThrown >= pitchLimit) {
      return true;
    }
    if (inning >= 4 && pitchingLine.earnedRuns >= 4) {
      return true;
    }
    if (inning >= 4 && Math.abs(scoreDiff) >= 5) {
      return true;
    }
    return false;
  }

  const relieverPitchLimit = 18 + Math.round(stamina * 0.12);
  if (pitchingLine.pitchesThrown >= relieverPitchLimit) {
    return true;
  }
  if (inning >= 9 && Math.abs(scoreDiff) <= 2 && pitchingLine.pitchesThrown >= 14) {
    return true;
  }
  if (Math.abs(scoreDiff) >= 5 && pitchingLine.pitchesThrown >= 12) {
    return true;
  }
  return false;
}

function chooseRelieverId(state: GameState, manager: PitchingManager, inning: number, scoreDiff: number) {
  if (manager.availableRelieverIds.length === 0) {
    return manager.currentPitcherId;
  }

  const available = [...manager.availableRelieverIds];
  if (inning >= 8 && Math.abs(scoreDiff) <= 2) {
    available.sort((left, right) => pitcherScore(state.players[right]) - pitcherScore(state.players[left]));
  } else if (Math.abs(scoreDiff) >= 5) {
    available.sort((left, right) => pitcherScore(state.players[left]) - pitcherScore(state.players[right]));
  }

  const nextPitcherId = available[0];
  manager.availableRelieverIds = manager.availableRelieverIds.filter((playerId) => playerId !== nextPitcherId);
  manager.currentPitcherId = nextPitcherId;
  return nextPitcherId;
}

function maybeChangePitcher(
  state: GameState,
  manager: PitchingManager,
  pitchingLines: Record<string, PitchingLine>,
  inning: number,
  scoreDiff: number,
  playByPlay: string[],
) {
  const currentLine = getPitchingLine(pitchingLines, manager.currentPitcherId);
  if (!shouldPullPitcher(state, manager, currentLine, inning, scoreDiff)) {
    return state.players[manager.currentPitcherId];
  }

  const nextPitcherId = chooseRelieverId(state, manager, inning, scoreDiff);
  getPitchingLine(pitchingLines, nextPitcherId);
  playByPlay.push(`Pitching change: ${manager.team.nickname} brings in ${state.players[nextPitcherId].fullName}.`);
  return state.players[nextPitcherId];
}

function finalizePitcherAppearance(pitchingLine: PitchingLine, outsRecorded: number, runsAllowed: number) {
  if (outsRecorded > 0) {
    incrementPitchingInnings(pitchingLine, outsRecorded);
  }
  pitchingLine.earnedRuns += runsAllowed;
}

function maybeChangePitcherDuringHalf(
  state: GameState,
  pitchingManager: PitchingManager,
  pitchingLines: Record<string, PitchingLine>,
  inning: number,
  outsRecorded: number,
  runsAllowedThisHalf: number,
  baserunnersAllowed: number,
  battersFaced: number,
  playByPlay: string[],
) {
  if (pitchingManager.availableRelieverIds.length === 0) {
    return false;
  }

  const currentLine = getPitchingLine(pitchingLines, pitchingManager.currentPitcherId);
  const pitcher = state.players[pitchingManager.currentPitcherId];
  const stamina = pitcher.ratings.pitching?.stamina ?? 45;
  const isStarter = pitchingManager.currentPitcherId === pitchingManager.starterId;
  const shouldChange = isStarter
    ? runsAllowedThisHalf >= 4
      || currentLine.pitchesThrown >= (80 + Math.round(stamina * 0.38))
      || (outsRecorded <= 1 && baserunnersAllowed >= 5)
      || (outsRecorded === 0 && battersFaced >= 8)
    : runsAllowedThisHalf >= 3
      || currentLine.pitchesThrown >= 24
      || (outsRecorded <= 1 && baserunnersAllowed >= 4)
      || (outsRecorded === 0 && battersFaced >= 7);

  if (!shouldChange) {
    return false;
  }

  const nextPitcherId = chooseRelieverId(state, pitchingManager, inning, 0);
  getPitchingLine(pitchingLines, nextPitcherId);
  playByPlay.push(`Pitching change: ${pitchingManager.team.nickname} goes to ${state.players[nextPitcherId].fullName} mid-inning.`);
  return true;
}

function simulateHalfInning(
  state: GameState,
  inning: number,
  half: "Top" | "Bottom",
  battingOrder: string[],
  battingIndex: { value: number },
  initialPitcher: Player,
  defenders: Player[],
  getPlayerDisplayName: (playerId: string) => string,
  battingLines: Record<string, ReturnType<typeof createBattingLine>>,
  pitchingManager: PitchingManager,
  pitchingLines: Record<string, PitchingLine>,
  playByPlay: string[],
): HalfInningResult {
  const bases: Array<string | null> = [null, null, null];
  let outs = 0;
  let runs = 0;
  let advancementEvents = 0;
  let plateAppearances = 0;
  let hits = 0;
  let walks = 0;
  let strikeouts = 0;
  let activePitcher = initialPitcher;
  let activePitchingLine = getPitchingLine(pitchingLines, pitchingManager.currentPitcherId);
  let activePitcherOuts = 0;
  let activePitcherRunsAllowed = 0;
  let activePitcherBaserunnersAllowed = 0;
  let activePitcherBattersFaced = 0;

  playByPlay.push(`${half} ${inning} begins.`);

  while (outs < 3) {
    const batterId = battingOrder[battingIndex.value % battingOrder.length];
    battingIndex.value += 1;
    const batter = state.players[batterId];
    const line = battingLines[batterId] ?? (battingLines[batterId] = createBattingLine(batterId));
    const outcome = resolvePlateAppearance(state, batter, activePitcher, defenders, activePitchingLine);
    activePitchingLine.pitchesThrown += outcome === "walk" ? 5 : outcome === "strikeout" ? 4 : 3;
    plateAppearances += 1;
    activePitcherBattersFaced += 1;

    if (outcome === "walk") {
      line.walks += 1;
      walks += 1;
      activePitchingLine.walks += 1;
      activePitcherBaserunnersAllowed += 1;
      const scoredRunnerIds = moveRunnersForWalk(bases, batterId);
      line.rbi += scoredRunnerIds.length;
      runs += scoredRunnerIds.length;
      activePitcherRunsAllowed += scoredRunnerIds.length;
      scoredRunnerIds.forEach((runnerId) => scoreRunner(battingLines, runnerId, []));
      const batterName = getPlayerDisplayName(batterId);
      if (scoredRunnerIds.length > 0) {
        playByPlay.push(`${half} ${inning}: ${batterName} walks with the bases loaded; ${scoredRunnerIds.length} run scores.`);
      } else {
        playByPlay.push(`${half} ${inning}: ${batterName} draws a walk. Bases now ${formatBases(bases, state, getPlayerDisplayName)}.`);
      }
      maybeStealBase(state, bases, battingLines);
    } else {
      line.atBats += 1;

      if (outcome === "strikeout") {
        outs += 1;
        activePitcherOuts += 1;
        line.strikeouts += 1;
        activePitchingLine.strikeouts += 1;
        strikeouts += 1;
        playByPlay.push(`${half} ${inning}: ${getPlayerDisplayName(batterId)} strikes out. ${outs} out(s).`);
      } else if (outcome === "out") {
        outs += 1;
        activePitcherOuts += 1;
        playByPlay.push(`${half} ${inning}: ${getPlayerDisplayName(batterId)} is retired. ${outs} out(s).`);
      } else {
        hits += 1;
        line.hits += 1;
        activePitchingLine.hitsAllowed += 1;
        activePitcherBaserunnersAllowed += 1;
        const result = moveRunnersForHit(state, bases, batter, outcome, battingLines);
        runs += result.scoredRunnerIds.length;
        activePitcherRunsAllowed += result.scoredRunnerIds.length;
        advancementEvents += result.advancementEvents;
        line.rbi += result.scoredRunnerIds.length;

        if (outcome === "double") {
          line.doubles += 1;
        } else if (outcome === "triple") {
          line.triples += 1;
        } else if (outcome === "homeRun") {
          line.homeRuns += 1;
          activePitchingLine.homeRunsAllowed += 1;
        }

        const outcomeLabel = outcome === "homeRun" ? "homers" : outcome;
        if (result.scoredRunnerIds.length > 0) {
          if (outcome === "homeRun") {
            playByPlay.push(`${half} ${inning}: ${getPlayerDisplayName(batterId)} ${outcomeLabel}; ${result.scoredRunnerIds.length} run(s) score.`);
          } else {
            playByPlay.push(`${half} ${inning}: ${getPlayerDisplayName(batterId)} ${outcomeLabel}; ${result.scoredRunnerIds.length} run(s) score. Bases now ${formatBases(bases, state, getPlayerDisplayName)}.`);
          }
        } else {
          playByPlay.push(`${half} ${inning}: ${getPlayerDisplayName(batterId)} hits a ${outcome}. Bases now ${formatBases(bases, state, getPlayerDisplayName)}.`);
        }

        maybeStealBase(state, bases, battingLines);
      }
    }

    if (
      outs < 3
      && maybeChangePitcherDuringHalf(
        state,
        pitchingManager,
        pitchingLines,
        inning,
        activePitcherOuts,
        activePitcherRunsAllowed,
        activePitcherBaserunnersAllowed,
        activePitcherBattersFaced,
        playByPlay,
      )
    ) {
      finalizePitcherAppearance(activePitchingLine, activePitcherOuts, activePitcherRunsAllowed);
      activePitcher = state.players[pitchingManager.currentPitcherId];
      activePitchingLine = getPitchingLine(pitchingLines, pitchingManager.currentPitcherId);
      activePitcherOuts = 0;
      activePitcherRunsAllowed = 0;
      activePitcherBaserunnersAllowed = 0;
      activePitcherBattersFaced = 0;
    }
  }

  finalizePitcherAppearance(activePitchingLine, activePitcherOuts, activePitcherRunsAllowed);
  playByPlay.push(`${half} ${inning} ends with ${runs} run(s).`);
  return { runs, plateAppearances, hits, walks, strikeouts, advancementEvents };
}

export function simulateGame(state: GameState, game: ScheduledGame): GameResult {
  const homeTeam = state.teams[game.homeTeamId];
  const awayTeam = state.teams[game.awayTeamId];
  const homeStarterId = homeTeam.rotation.starterPlayerIds[homeTeam.rotation.nextStarterIndex % homeTeam.rotation.starterPlayerIds.length];
  const awayStarterId = awayTeam.rotation.starterPlayerIds[awayTeam.rotation.nextStarterIndex % awayTeam.rotation.starterPlayerIds.length];
  const getHomeDisplayName = createDisplayNameGetter(state, homeTeam.activeLineup.battingOrderPlayerIds);
  const getAwayDisplayName = createDisplayNameGetter(state, awayTeam.activeLineup.battingOrderPlayerIds);
  const homeBattingIndex = { value: 0 };
  const awayBattingIndex = { value: 0 };
  const battingLines: Record<string, ReturnType<typeof createBattingLine>> = {};
  const homePitching = createPitchingManager(homeTeam, state, homeStarterId);
  const awayPitching = createPitchingManager(awayTeam, state, awayStarterId);
  const pitchingLines: Record<string, PitchingLine> = {
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
  const playByPlay: string[] = [
    `First pitch: ${awayTeam.nickname} at ${homeTeam.nickname}.`,
  ];

  for (let inning = 1; inning <= 9; inning += 1) {
    const homePitcher = maybeChangePitcher(state, homePitching, pitchingLines, inning, homeScore - awayScore, playByPlay);
    const awayHalf = simulateHalfInning(
      state,
      inning,
      "Top",
      awayTeam.activeLineup.battingOrderPlayerIds,
      awayBattingIndex,
      homePitcher,
      homeTeam.activeLineup.battingOrderPlayerIds.map((playerId) => state.players[playerId]),
      getAwayDisplayName,
      battingLines,
      homePitching,
      pitchingLines,
      playByPlay,
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

    const awayPitcher = maybeChangePitcher(state, awayPitching, pitchingLines, inning, awayScore - homeScore, playByPlay);
    const homeHalf = simulateHalfInning(
      state,
      inning,
      "Bottom",
      homeTeam.activeLineup.battingOrderPlayerIds,
      homeBattingIndex,
      awayPitcher,
      awayTeam.activeLineup.battingOrderPlayerIds.map((playerId) => state.players[playerId]),
      getHomeDisplayName,
      battingLines,
      awayPitching,
      pitchingLines,
      playByPlay,
    );
    homeScore += homeHalf.runs;
    totalPlateAppearances += homeHalf.plateAppearances;
    totalHits += homeHalf.hits;
    totalWalks += homeHalf.walks;
    totalStrikeouts += homeHalf.strikeouts;
    runnerAdvancementEvents += homeHalf.advancementEvents;
  }

  const notableEvents: string[] = [];
  if (homeScore === awayScore) {
    inningsPlayed = 10;
    const averageClutch = (team: Team) => team.activeLineup.battingOrderPlayerIds
      .map((playerId) => state.players[playerId].ratings.hitting.clutch)
      .reduce((sum, rating) => sum + rating, 0) / Math.max(1, team.activeLineup.battingOrderPlayerIds.length);
    const homeClutch = averageClutch(homeTeam) + 2;
    const awayClutch = averageClutch(awayTeam);
    const homeWinChance = clamp(0.5 + ((homeClutch - awayClutch) / 120), 0.4, 0.6);
    const winningSide = nextRoll(state) <= homeWinChance ? "home" : "away";

    if (nextRoll(state) < 0.78) {
      if (winningSide === "home") {
        const homePitcher = maybeChangePitcher(state, homePitching, pitchingLines, 10, homeScore - awayScore, playByPlay);
        const awayTenth = appendScorelessBonusFrame(10, "Top", getPitchingLine(pitchingLines, homePitching.currentPitcherId), playByPlay);
        totalPlateAppearances += awayTenth.plateAppearances;
        const awayPitcher = maybeChangePitcher(state, awayPitching, pitchingLines, 10, awayScore - homeScore, playByPlay);
        const homeTenth = appendDecisiveBonusFrame(
          10,
          "Bottom",
          "rally",
          homeTeam.activeLineup.battingOrderPlayerIds,
          homeBattingIndex,
          battingLines,
          getPitchingLine(pitchingLines, awayPitching.currentPitcherId),
          getHomeDisplayName,
          playByPlay,
        );
        void homePitcher;
        void awayPitcher;
        homeScore += homeTenth.runs;
        totalPlateAppearances += homeTenth.plateAppearances;
        totalHits += homeTenth.hits;
        runnerAdvancementEvents += homeTenth.advancementEvents;
      } else {
        const homePitcher = maybeChangePitcher(state, homePitching, pitchingLines, 10, homeScore - awayScore, playByPlay);
        const awayTenth = appendDecisiveBonusFrame(
          10,
          "Top",
          "rally",
          awayTeam.activeLineup.battingOrderPlayerIds,
          awayBattingIndex,
          battingLines,
          getPitchingLine(pitchingLines, homePitching.currentPitcherId),
          getAwayDisplayName,
          playByPlay,
        );
        awayScore += awayTenth.runs;
        totalPlateAppearances += awayTenth.plateAppearances;
        totalHits += awayTenth.hits;
        runnerAdvancementEvents += awayTenth.advancementEvents;
        const awayPitcher = maybeChangePitcher(state, awayPitching, pitchingLines, 10, awayScore - homeScore, playByPlay);
        const homeTenth = appendScorelessBonusFrame(10, "Bottom", getPitchingLine(pitchingLines, awayPitching.currentPitcherId), playByPlay);
        totalPlateAppearances += homeTenth.plateAppearances;
        void homePitcher;
        void awayPitcher;
      }
      notableEvents.push("The clubs needed extra innings to settle it.");
    } else if (winningSide === "home") {
      maybeChangePitcher(state, homePitching, pitchingLines, 10, homeScore - awayScore, playByPlay);
      const awayTenth = appendScorelessBonusFrame(10, "Top", getPitchingLine(pitchingLines, homePitching.currentPitcherId), playByPlay);
      totalPlateAppearances += awayTenth.plateAppearances;
      maybeChangePitcher(state, awayPitching, pitchingLines, 10, awayScore - homeScore, playByPlay);
      const homeTenth = appendDecisiveBonusFrame(
        10,
        "Bottom",
        "tiebreak",
        homeTeam.activeLineup.battingOrderPlayerIds,
        homeBattingIndex,
        battingLines,
        getPitchingLine(pitchingLines, awayPitching.currentPitcherId),
        getHomeDisplayName,
        playByPlay,
      );
      homeScore += homeTenth.runs;
      totalPlateAppearances += homeTenth.plateAppearances;
      totalHits += homeTenth.hits;
      runnerAdvancementEvents += homeTenth.advancementEvents;
      notableEvents.push("The league tiebreak rule decided the game in the 10th.");
    } else {
      maybeChangePitcher(state, homePitching, pitchingLines, 10, homeScore - awayScore, playByPlay);
      const awayTenth = appendDecisiveBonusFrame(
        10,
        "Top",
        "tiebreak",
        awayTeam.activeLineup.battingOrderPlayerIds,
        awayBattingIndex,
        battingLines,
        getPitchingLine(pitchingLines, homePitching.currentPitcherId),
        getAwayDisplayName,
        playByPlay,
      );
      awayScore += awayTenth.runs;
      totalPlateAppearances += awayTenth.plateAppearances;
      totalHits += awayTenth.hits;
      runnerAdvancementEvents += awayTenth.advancementEvents;
      maybeChangePitcher(state, awayPitching, pitchingLines, 10, awayScore - homeScore, playByPlay);
      const homeTenth = appendScorelessBonusFrame(10, "Bottom", getPitchingLine(pitchingLines, awayPitching.currentPitcherId), playByPlay);
      totalPlateAppearances += homeTenth.plateAppearances;
      notableEvents.push("The league tiebreak rule decided the game in the 10th.");
    }
  }

  totalHits += ensureTeamHasAHit(homeTeam, battingLines, getPitchingLine(pitchingLines, awayPitching.currentPitcherId));
  totalHits += ensureTeamHasAHit(awayTeam, battingLines, getPitchingLine(pitchingLines, homePitching.currentPitcherId));

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
  const winningPitcherId = winningTeamId === game.homeTeamId ? homePitching.currentPitcherId : awayPitching.currentPitcherId;
  const losingPitcherId = losingTeamId === game.homeTeamId ? homePitching.currentPitcherId : awayPitching.currentPitcherId;
  const homeHomeRuns = Object.values(battingLines).filter((line) => line.homeRuns > 0 && homeTeam.rosterPlayerIds.includes(line.playerId));
  const awayHomeRuns = Object.values(battingLines).filter((line) => line.homeRuns > 0 && awayTeam.rosterPlayerIds.includes(line.playerId));
  if (homeHomeRuns.length > 0 || awayHomeRuns.length > 0) {
    notableEvents.push("The long ball decided key moments.");
  }
  if (Math.abs(homeScore - awayScore) >= 5) {
    notableEvents.push("One club pulled away late.");
  }

  playByPlay.push(`Final: ${awayTeam.nickname} ${awayScore}, ${homeTeam.nickname} ${homeScore}.`);

  return {
    homeScore,
    awayScore,
    inningsPlayed,
    winningTeamId,
    losingTeamId,
    winningPitcherId,
    losingPitcherId,
    attendance,
    notableEvents,
    playByPlay,
    boxScore: {
      battingLines,
      pitchingLines,
      errorsByTeam: {
        [game.homeTeamId]: nextRoll(state) > 0.9 ? 1 : 0,
        [game.awayTeamId]: nextRoll(state) > 0.9 ? 1 : 0,
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
























