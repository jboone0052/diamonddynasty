import { GameState, PlayerPosition, Team } from "../types/gameState";

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function recalculatePayroll(state: GameState, teamId: string) {
  const payrollMonthly = Object.values(state.contracts)
    .filter((contract) => contract.teamId === teamId)
    .reduce((total, contract) => total + Math.round(contract.annualSalary / 12), 0);
  state.finances[teamId].payrollMonthly = payrollMonthly;
}

function applyRosterDepthChart(team: Team, state: GameState) {
  const healthy = team.rosterPlayerIds.filter((playerId) => {
    const player = state.players[playerId];
    return player && player.status !== "injured" && player.status !== "suspended" && player.status !== "retired";
  });

  if (healthy.length >= 9) {
    const battingOrder = team.activeLineup.battingOrderPlayerIds.filter((playerId) => healthy.includes(playerId));
    for (const playerId of healthy) {
      if (battingOrder.length >= 9) break;
      if (!battingOrder.includes(playerId)) battingOrder.push(playerId);
    }
    team.activeLineup.battingOrderPlayerIds = battingOrder;

    const starter = team.rotation.starterPlayerIds[team.rotation.nextStarterIndex % Math.max(team.rotation.starterPlayerIds.length, 1)] ?? healthy[0];
    const defenseKeys = ["P", "C", "1B", "2B", "3B", "SS", "LF", "CF", "RF", "DH"] as const;
    defenseKeys.forEach((position, index) => {
      team.activeLineup.defensiveAssignments[position] = position === "P"
        ? starter
        : battingOrder[Math.min(Math.max(index - 1, 0), battingOrder.length - 1)];
    });
    team.activeLineup.designatedHitterPlayerId = battingOrder[8];
  }

  const healthyPitchers = healthy.filter((playerId) => {
    const position = state.players[playerId].primaryPosition;
    return position === "SP" || position === "RP";
  });
  if (healthyPitchers.length >= 3) {
    const starters = team.rotation.starterPlayerIds.filter((playerId) => healthyPitchers.includes(playerId));
    for (const playerId of healthyPitchers) {
      if (starters.length >= Math.min(5, healthyPitchers.length)) break;
      if (!starters.includes(playerId)) starters.push(playerId);
    }
    team.rotation.starterPlayerIds = starters;
    team.bullpenPlayerIds = healthyPitchers.filter((playerId) => !starters.includes(playerId)).slice(0, 4);
  }

  team.reservePlayerIds = team.rosterPlayerIds.filter((playerId) => !team.activeLineup.battingOrderPlayerIds.includes(playerId) && !team.rotation.starterPlayerIds.includes(playerId));
  team.injuredPlayerIds = team.rosterPlayerIds.filter((playerId) => state.players[playerId].status === "injured");
}

function startingSalary(position: PlayerPosition) {
  switch (position) {
    case "SP":
      return 220000;
    case "RP":
      return 180000;
    case "C":
    case "SS":
      return 160000;
    default:
      return 140000;
  }
}

export function releasePlayer(state: GameState, teamId: string, playerId: string): GameState {
  const next = clone(state);
  const team = next.teams[teamId];
  if (!team) throw new Error("Team not found.");
  if (!team.rosterPlayerIds.includes(playerId)) throw new Error("Player is not on this roster.");
  if (team.rosterPlayerIds.length <= 18) throw new Error("Roster must keep at least 18 players.");

  const player = next.players[playerId];
  if (!player) throw new Error("Player not found.");

  team.rosterPlayerIds = team.rosterPlayerIds.filter((id) => id !== playerId);
  team.reservePlayerIds = team.reservePlayerIds.filter((id) => id !== playerId);
  team.bullpenPlayerIds = team.bullpenPlayerIds.filter((id) => id !== playerId);
  team.rotation.starterPlayerIds = team.rotation.starterPlayerIds.filter((id) => id !== playerId);

  const contractId = player.contractId;
  if (contractId) {
    delete next.contracts[contractId];
  }

  player.contractId = undefined;
  player.currentTeamId = undefined;
  player.morale = Math.max(0, player.morale - 5);

  applyRosterDepthChart(team, next);
  recalculatePayroll(next, teamId);
  next.teams[teamId].cash = next.finances[teamId].currentCash;
  return next;
}

export function signFreeAgent(state: GameState, teamId: string, playerId: string): GameState {
  const next = clone(state);
  const team = next.teams[teamId];
  if (!team) throw new Error("Team not found.");

  const player = next.players[playerId];
  if (!player) throw new Error("Player not found.");
  if (player.currentTeamId) throw new Error("Player is already under contract.");

  const contractId = `contract_${teamId}_${playerId}_${next.world.currentWeek}`;
  const annualSalary = startingSalary(player.primaryPosition);
  const expirationSeason = next.world.currentSeason + 1;

  next.contracts[contractId] = {
    id: contractId,
    playerId,
    teamId,
    annualSalary,
    yearsTotal: 1,
    yearsRemaining: 1,
    signedDate: next.world.currentDate,
    expirationSeason,
    bonusClauses: [],
    noTradeClause: false,
  };

  player.contractId = contractId;
  player.currentTeamId = teamId;
  player.morale = Math.min(100, player.morale + 3);

  if (!team.rosterPlayerIds.includes(playerId)) {
    team.rosterPlayerIds.push(playerId);
  }

  if (player.primaryPosition === "SP" || player.primaryPosition === "RP") {
    if (team.rotation.starterPlayerIds.length < 5 && player.primaryPosition === "SP") {
      team.rotation.starterPlayerIds.push(playerId);
    } else if (!team.bullpenPlayerIds.includes(playerId)) {
      team.bullpenPlayerIds.push(playerId);
    }
  } else if (!team.reservePlayerIds.includes(playerId)) {
    team.reservePlayerIds.push(playerId);
  }

  applyRosterDepthChart(team, next);
  recalculatePayroll(next, teamId);
  return next;
}
