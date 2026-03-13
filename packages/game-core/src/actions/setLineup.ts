import { GameState, TeamLineup } from "../types/gameState";

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

export function setLineup(input: GameState, teamId: string, lineup: TeamLineup): GameState {
  const team = input.teams[teamId];
  if (!team) {
    throw new Error(`Team ${teamId} not found.`);
  }

  const uniqueBatters = new Set(lineup.battingOrderPlayerIds);
  if (lineup.battingOrderPlayerIds.length !== 9 || uniqueBatters.size !== 9) {
    throw new Error("Lineup must contain 9 unique players.");
  }

  lineup.battingOrderPlayerIds.forEach((playerId) => {
    if (!team.rosterPlayerIds.includes(playerId)) {
      throw new Error(`Player ${playerId} is not on team ${teamId}.`);
    }
  });

  const state = clone(input);
  state.teams[teamId].activeLineup = lineup;
  state.meta.updatedAt = new Date().toISOString();
  state.eventLog.push({
    id: `event_${state.eventLog.length + 1}`,
    timestamp: state.meta.updatedAt,
    actionType: "SET_LINEUP",
    actorTeamId: teamId,
    payload: { battingOrderPlayerIds: lineup.battingOrderPlayerIds },
    summary: `${state.teams[teamId].nickname} updated the batting order.`,
  });
  return state;
}
