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
  it("assigns one starter per defensive position in the initial lineup", () => {
    const game = createNewGame();

    for (const team of Object.values(game.teams)) {
      const assignments = team.activeLineup.defensiveAssignments;
      expect(game.players[assignments.C].primaryPosition).toBe("C");
      expect(game.players[assignments["1B"]].primaryPosition).toBe("1B");
      expect(game.players[assignments["2B"]].primaryPosition).toBe("2B");
      expect(game.players[assignments["3B"]].primaryPosition).toBe("3B");
      expect(game.players[assignments.SS].primaryPosition).toBe("SS");
      expect(game.players[assignments.LF].primaryPosition).toBe("LF");
      expect(game.players[assignments.CF].primaryPosition).toBe("CF");
      expect(game.players[assignments.RF].primaryPosition).toBe("RF");
      expect(game.players[assignments.DH].primaryPosition).toBe("DH");
      expect(game.players[assignments.P].primaryPosition).toBe("SP");
    }
  });

  it("creates at least one reserve backup option for every position", () => {
    const game = createNewGame();
    const positions = ["SP", "RP", "C", "1B", "2B", "3B", "SS", "LF", "CF", "RF", "DH"] as const;

    for (const team of Object.values(game.teams)) {
      const reservePlayers = team.reservePlayerIds.map((playerId) => game.players[playerId]);

      for (const position of positions) {
        const hasBackup = reservePlayers.some((player) => {
          return player.primaryPosition === position || player.secondaryPositions.includes(position);
        });
        expect(hasBackup).toBe(true);
      }
    }
  });

  it("uses a unique default RNG seed for each new save", () => {
    const first = createNewGame();
    const second = createNewGame();

    expect(first.rng.seed).not.toBe(second.rng.seed);
    expect(first.rng.seed.length).toBeGreaterThan(0);
    expect(second.rng.seed.length).toBeGreaterThan(0);
  });

  it("accepts a caller-provided RNG seed", () => {
    const game = createNewGame("fixed-seed-for-test");
    expect(game.rng.seed).toBe("fixed-seed-for-test");
  });

});
