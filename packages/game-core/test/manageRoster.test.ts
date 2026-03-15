import { describe, expect, it } from "vitest";
import { createNewGame } from "../src/factories/createNewGame";
import { releasePlayer, signFreeAgent } from "../src/actions/manageRoster";

describe("manageRoster", () => {
  it("releases a rostered player into free agency and updates payroll", () => {
    const game = createNewGame();
    const teamId = game.world.userTeamId;
    const playerId = game.teams[teamId].reservePlayerIds[0];
    const player = game.players[playerId];
    const contractId = player.contractId!;
    const startingPayroll = game.finances[teamId].payrollMonthly;

    const next = releasePlayer(game, teamId, playerId);

    expect(next.teams[teamId].rosterPlayerIds).not.toContain(playerId);
    expect(next.players[playerId].currentTeamId).toBeUndefined();
    expect(next.players[playerId].contractId).toBeUndefined();
    expect(next.players[playerId].status).toBe("freeAgent");
    expect(next.contracts[contractId]).toBeUndefined();
    expect(next.finances[teamId].payrollMonthly).toBeLessThan(startingPayroll);
  });

  it("signs a free agent and adds a one-year contract", () => {
    const game = createNewGame();
    const teamId = game.world.userTeamId;
    const playerId = game.teams[teamId].reservePlayerIds[0];

    const released = releasePlayer(game, teamId, playerId);
    const next = signFreeAgent(released, teamId, playerId);

    expect(next.teams[teamId].rosterPlayerIds).toContain(playerId);
    expect(next.players[playerId].currentTeamId).toBe(teamId);
    expect(next.players[playerId].contractId).toBeDefined();
    expect(next.players[playerId].status).toBe("active");

    const signedContract = next.contracts[next.players[playerId].contractId!];
    expect(signedContract.playerId).toBe(playerId);
    expect(signedContract.teamId).toBe(teamId);
    expect(signedContract.yearsTotal).toBe(1);
  });
});
