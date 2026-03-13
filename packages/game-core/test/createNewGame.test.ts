import { describe, expect, it } from "vitest";
import { createNewGame } from "../src/factories/createNewGame";

describe("createNewGame", () => {
  it("creates a world with 8 teams", () => {
    const game = createNewGame();
    expect(Object.keys(game.teams)).toHaveLength(8);
  });

  it("creates a user team", () => {
    const game = createNewGame();
    expect(game.world.userTeamId).toBe("team_harbor_city");
    expect(game.teams[game.world.userTeamId].isHumanControlled).toBe(true);
  });
});
