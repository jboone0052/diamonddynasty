import { GameState, FtueScreen, FtueStep, StoryState } from "./types/gameState";

export const FTUE_STEP_ORDER: FtueStep[] = [
  "inheritanceBriefing",
  "scoutPitcher",
  "signPitcher",
  "reviewPromotion",
  "reviewLineup",
  "reviewFinances",
  "advanceWeek",
  "reviewResults",
  "completed",
];

export const FTUE_STEP_CONFIG: Record<FtueStep, {
  title: string;
  description: string;
  primaryScreen: FtueScreen;
  actionLabel: string;
  allowedScreens: FtueScreen[];
}> = {
  inheritanceBriefing: {
    title: "Read the inheritance briefing",
    description: "Start with the club handoff so the first season has context and a clear goal.",
    primaryScreen: "intro",
    actionLabel: "Open Briefing",
    allowedScreens: ["dashboard", "intro", "inbox", "saves"],
  },
  scoutPitcher: {
    title: "Scout a pitcher",
    description: "Your roster needs pitching depth. File a scouting report on an unsigned pitcher.",
    primaryScreen: "scouting",
    actionLabel: "Scout a Pitcher",
    allowedScreens: ["dashboard", "scouting", "inbox", "saves"],
  },
  signPitcher: {
    title: "Sign the scouted pitcher",
    description: "Use the report you just filed and bring a pitcher into the club.",
    primaryScreen: "scouting",
    actionLabel: "Sign the Pitcher",
    allowedScreens: ["dashboard", "scouting", "inbox", "saves"],
  },
  reviewPromotion: {
    title: "Review the promotion ladder",
    description: "Check the promotion requirements so the long-term objective is clear before you play.",
    primaryScreen: "promotion",
    actionLabel: "Review Promotion",
    allowedScreens: ["dashboard", "promotion", "inbox", "saves"],
  },
  reviewLineup: {
    title: "Review your lineup",
    description: "Set the batting order and rotation before the season begins.",
    primaryScreen: "lineup",
    actionLabel: "Review Lineup",
    allowedScreens: ["dashboard", "lineup", "roster", "inbox", "saves"],
  },
  reviewFinances: {
    title: "Review ticket pricing",
    description: "Check club finances and ticket pricing before the home gate opens.",
    primaryScreen: "finances",
    actionLabel: "Review Finances",
    allowedScreens: ["dashboard", "finances", "inbox", "saves"],
  },
  advanceWeek: {
    title: "Advance the first week",
    description: "You are ready to simulate the opening week and get your first results recap.",
    primaryScreen: "dashboard",
    actionLabel: "Advance Week",
    allowedScreens: ["dashboard", "results", "inbox", "saves"],
  },
  reviewResults: {
    title: "Review the opening results",
    description: "Your club opened with a win. Review the results summary, then the full front office unlocks.",
    primaryScreen: "results",
    actionLabel: "Review Results",
    allowedScreens: ["results", "dashboard", "inbox", "saves"],
  },
  completed: {
    title: "Tutorial complete",
    description: "The front office is fully unlocked.",
    primaryScreen: "dashboard",
    actionLabel: "Open Dashboard",
    allowedScreens: ["dashboard", "intro", "scouting", "promotion", "lineup", "finances", "inbox", "saves", "results"],
  },
};

const FTUE_NEXT_STEP: Record<FtueStep, FtueStep> = {
  inheritanceBriefing: "scoutPitcher",
  scoutPitcher: "signPitcher",
  signPitcher: "reviewPromotion",
  reviewPromotion: "reviewLineup",
  reviewLineup: "reviewFinances",
  reviewFinances: "advanceWeek",
  advanceWeek: "reviewResults",
  reviewResults: "completed",
  completed: "completed",
};

export function buildInitialFtueState(highlightedProspectId?: string): StoryState["ftue"] {
  return {
    isActive: true,
    currentStep: "inheritanceBriefing",
    completedSteps: [],
    highlightedProspectId,
  };
}

export function buildCompletedFtueState(highlightedProspectId?: string): StoryState["ftue"] {
  return {
    isActive: false,
    currentStep: "completed",
    completedSteps: [...FTUE_STEP_ORDER],
    highlightedProspectId,
  };
}

export function buildMigratedFtueState(state: Pick<GameState, "story">, highlightedProspectId?: string): StoryState["ftue"] {
  if (state.story.introCompleted) {
    return buildCompletedFtueState(highlightedProspectId);
  }
  return buildInitialFtueState(highlightedProspectId);
}

export function completeFtueStep(state: GameState, step: FtueStep, summary: string) {
  const ftue = state.story.ftue;
  if (!ftue.isActive || ftue.currentStep !== step) {
    return false;
  }

  if (!ftue.completedSteps.includes(step)) {
    ftue.completedSteps.push(step);
  }

  const nextStep = FTUE_NEXT_STEP[step];
  ftue.currentStep = nextStep;
  if (nextStep !== "scoutPitcher" && nextStep !== "signPitcher") {
    ftue.highlightedProspectId = undefined;
  }
  if (nextStep === "completed") {
    ftue.isActive = false;
    if (!ftue.completedSteps.includes("completed")) {
      ftue.completedSteps.push("completed");
    }
  }

  state.eventLog.push({
    id: `event_${state.eventLog.length + 1}`,
    timestamp: state.meta.updatedAt,
    actionType: "ADVANCE_FTUE",
    actorTeamId: state.world.userTeamId,
    payload: { completedStep: step, nextStep },
    summary,
  });
  return true;
}

export function getFtueConfig(step: FtueStep) {
  return FTUE_STEP_CONFIG[step];
}
