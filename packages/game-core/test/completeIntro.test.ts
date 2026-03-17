import { describe, expect, it } from "vitest";
import { completeIntro } from "../src/actions/completeIntro";
import { createNewGame } from "../src/factories/createNewGame";

describe("completeIntro", () => {
  it("marks the intro complete, applies customization, and records an event", () => {
    const game = createNewGame("test-seed");

    const updated = completeIntro(game, { ownerName: "Jordan Hale", teamNickname: "Clippers" });
    const latestEvent = updated.eventLog[updated.eventLog.length - 1];

    expect(updated.story.introCompleted).toBe(true);
    expect(updated.story.currentChapter).toBe("rebuild");
    expect(updated.world.ownerName).toBe("Jordan Hale");
    expect(updated.teams[updated.world.userTeamId].nickname).toBe("Clippers");
    expect(updated.teams[updated.world.userTeamId].name).toBe("Harbor City Clippers");
    expect(latestEvent?.actionType).toBe("COMPLETE_INTRO");
    expect(game.story.introCompleted).toBe(false);
  });
});
