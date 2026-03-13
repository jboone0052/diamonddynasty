import { GameState } from "../types/gameState";

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

export function setRotation(input: GameState, teamId: string, starterPlayerIds: string[]): GameState {
  const team = input.teams[teamId];
  if (!team) {
    throw new Error(`Team ${teamId} not found.`);
  }

  const uniqueStarters = new Set(starterPlayerIds);
  if (starterPlayerIds.length < 3 || uniqueStarters.size !== starterPlayerIds.length) {
    throw new Error("Rotation must contain at least 3 unique starters.");
  }

  starterPlayerIds.forEach((playerId) => {
    if (!team.rosterPlayerIds.includes(playerId)) {
      throw new Error(`Player ${playerId} is not on team ${teamId}.`);
    }
  });

  const state = clone(input);
  state.teams[teamId].rotation = {
    starterPlayerIds,
    nextStarterIndex: 0,
  };
  state.meta.updatedAt = new Date().toISOString();
  state.eventLog.push({
    id: `event_${state.eventLog.length + 1}`,
    timestamp: state.meta.updatedAt,
    actionType: "SET_ROTATION",
    actorTeamId: teamId,
    payload: { starterPlayerIds },
    summary: `${state.teams[teamId].nickname} updated the rotation.`,
  });
  return state;
}
