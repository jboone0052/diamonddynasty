import { GameState } from "../types/gameState";

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

export function completeIntro(input: GameState): GameState {
  if (input.story.introCompleted) {
    return input;
  }

  const state = clone(input);
  const now = new Date().toISOString();

  state.story.introCompleted = true;
  state.story.currentChapter = "rebuild";
  state.meta.updatedAt = now;
  state.eventLog.push({
    id: `event_${state.eventLog.length + 1}`,
    timestamp: now,
    actionType: "COMPLETE_INTRO",
    actorTeamId: state.world.userTeamId,
    payload: {
      chapter: state.story.currentChapter,
    },
    summary: "Reviewed the inheritance briefing and took control of the club.",
  });

  return state;
}
