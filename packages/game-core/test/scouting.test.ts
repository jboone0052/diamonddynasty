import { describe, expect, it } from "vitest";
import { createNewGame, getScoutingSnapshot, getVisibleFreeAgentMarket, scoutProspect } from "../src";

describe("prospect scouting", () => {
  it("creates a scouting report for an unsigned prospect", () => {
    const game = createNewGame("scouting-report-seed");
    const teamId = game.world.userTeamId;
    const target = Object.values(game.players).find((player) => !player.currentTeamId && player.status === "freeAgent" && player.age <= 24)!;

    const next = scoutProspect(game, teamId, target.id);
    const report = next.scouting[teamId].prospectBoard.find((item) => item.playerId === target.id);

    expect(report).toBeDefined();
    expect(report!.scoutedOverallEstimate).toBeGreaterThan(0);
    expect(report!.scoutedPotentialEstimate).toBeGreaterThanOrEqual(report!.scoutedOverallEstimate);
    expect(next.mailbox.messages[0].relatedEntityId).toBe(target.id);
  });

  it("keeps unscouted prospects out of the visible free-agent market", () => {
    const game = createNewGame("scouting-market-seed");
    const teamId = game.world.userTeamId;
    const unsigned = Object.values(game.players).filter((player) => !player.currentTeamId && player.status === "freeAgent");
    const prospect = unsigned.find((player) => player.age <= 24)!;
    const veteran = unsigned.find((player) => player.age >= 25)!;

    const marketBefore = getVisibleFreeAgentMarket(game, teamId);
    expect(marketBefore.some((item) => item.player.id === prospect.id)).toBe(false);
    expect(marketBefore.some((item) => item.player.id === veteran.id)).toBe(true);

    const scouted = scoutProspect(game, teamId, prospect.id);
    const marketAfter = getVisibleFreeAgentMarket(scouted, teamId);
    expect(marketAfter.some((item) => item.player.id === prospect.id)).toBe(true);
  });

  it("surfaces pitcher targets in the scouting snapshot", () => {
    const game = createNewGame("scouting-pitcher-seed");
    const snapshot = getScoutingSnapshot(game);

    expect(snapshot.availableProspects.length).toBeGreaterThan(0);
    expect(snapshot.recommendedPitchers.length).toBeGreaterThan(0);
    expect(snapshot.recommendedPitchers.every((item) => item.player.primaryPosition === "SP" || item.player.primaryPosition === "RP")).toBe(true);
  });
});
