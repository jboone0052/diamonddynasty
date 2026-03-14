import { describe, expect, it } from "vitest";
import { GameStateSchema } from "../src/schemas/gameStateSchema";
import { createNewGame } from "../src/factories/createNewGame";

describe("createNewGame", () => {
  it("creates a schema-valid world with 8 teams and a full schedule", () => {
    const game = createNewGame();
    expect(GameStateSchema.parse(game)).toBeTruthy();
    expect(Object.keys(game.teams)).toHaveLength(8);
    expect(Object.keys(game.schedule)).toHaveLength(56);
    expect(game.world.weeksInSeason).toBe(14);
  });

  it("creates a user team with lineup, rotation, and support systems", () => {
    const game = createNewGame();
    const team = game.teams[game.world.userTeamId];
    expect(team.isHumanControlled).toBe(true);
    expect(team.activeLineup.battingOrderPlayerIds).toHaveLength(9);
    expect(team.rotation.starterPlayerIds.length).toBeGreaterThanOrEqual(3);
    expect(game.finances[team.id].ticketPrice).toBeGreaterThan(0);
    expect(game.story.activeObjectiveIds).toContain("obj_first_promotion");
    expect(game.mailbox.messages.length).toBeGreaterThanOrEqual(3);
  });

  it("generates unique full names within each team roster", () => {
    const game = createNewGame();

    for (const team of Object.values(game.teams)) {
      const rosterPlayers = team.rosterPlayerIds.map((playerId) => game.players[playerId]);
      const fullNames = rosterPlayers.map((player) => player.fullName);
      expect(new Set(fullNames).size).toBe(fullNames.length);
    }
  });
});
