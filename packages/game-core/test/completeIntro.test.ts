import { describe, expect, it } from "vitest";
import { completeIntro } from "../src/actions/completeIntro";
import { createNewGame } from "../src/factories/createNewGame";

describe("completeIntro", () => {
  it("marks the intro complete and records an event", () => {
    const game = createNewGame("test-seed");

    const updated = completeIntro(game);
    const latestEvent = updated.eventLog[updated.eventLog.length - 1];

    expect(updated.story.introCompleted).toBe(true);
    expect(updated.story.currentChapter).toBe("rebuild");
    expect(latestEvent?.actionType).toBe("COMPLETE_INTRO");
    expect(game.story.introCompleted).toBe(false);
  });
});
