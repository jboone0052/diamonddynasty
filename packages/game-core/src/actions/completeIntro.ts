import { GameState } from "../types/gameState";
import { completeFtueStep } from "../ftue";

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function normalizeNickname(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

type CompleteIntroInput = {
  ownerName: string;
  teamNickname?: string;
};

export function completeIntro(input: GameState, customization: CompleteIntroInput): GameState {
  if (input.story.introCompleted) {
    return input;
  }

  const ownerName = customization.ownerName.trim().replace(/\s+/g, " ");
  if (ownerName.length < 2 || ownerName.length > 40) {
    throw new Error("Owner name must be between 2 and 40 characters.");
  }

  const state = clone(input);
  const now = new Date().toISOString();
  const team = state.teams[state.world.userTeamId];
  const requestedNickname = normalizeNickname(customization.teamNickname ?? "");
  if (requestedNickname.length === 1 || requestedNickname.length > 24) {
    throw new Error("Team nickname must be blank or between 2 and 24 characters.");
  }
  const nextNickname = requestedNickname.length >= 2 && requestedNickname.length <= 24
    ? requestedNickname
    : team.nickname;

  state.story.introCompleted = true;
  state.story.currentChapter = "rebuild";
  state.world.ownerName = ownerName;
  team.nickname = nextNickname;
  team.name = `${team.city} ${nextNickname}`;
  state.meta.saveName = `${team.name} Franchise`;
  state.meta.updatedAt = now;
  completeFtueStep(state, "inheritanceBriefing", "Finished the club inheritance briefing.");
  state.eventLog.push({
    id: `event_${state.eventLog.length + 1}`,
    timestamp: now,
    actionType: "COMPLETE_INTRO",
    actorTeamId: state.world.userTeamId,
    payload: {
      chapter: state.story.currentChapter,
      ownerName,
      teamNickname: nextNickname,
    },
    summary: `${ownerName} took control of the ${team.name}.`,
  });

  return state;
}
