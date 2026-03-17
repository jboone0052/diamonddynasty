import { describe, expect, it } from "vitest";
import { createNewGame } from "../src/factories/createNewGame";
import { getStartingAnnualSalary, releasePlayer, signFreeAgent } from "../src/actions/manageRoster";

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

  it("signs a visible veteran free agent and adds a one-year contract", () => {
    const game = createNewGame("veteran-free-agent-seed");
    const teamId = game.world.userTeamId;
    const player = Object.values(game.players).find((candidate) => !candidate.currentTeamId && candidate.status === "freeAgent" && candidate.age >= 25)!;

    const next = signFreeAgent(game, teamId, player.id);

    expect(next.teams[teamId].rosterPlayerIds).toContain(player.id);
    expect(next.players[player.id].currentTeamId).toBe(teamId);
    expect(next.players[player.id].contractId).toBeDefined();
    expect(next.players[player.id].status).toBe("active");

    const signedContract = next.contracts[next.players[player.id].contractId!];
    expect(signedContract.playerId).toBe(player.id);
    expect(signedContract.teamId).toBe(teamId);
    expect(signedContract.yearsTotal).toBe(1);
  });

  it("prices new signings in line with seeded roster contracts", () => {
    const game = createNewGame("signing-salary-seed");
    const teamId = game.world.userTeamId;
    const rosterContracts = game.teams[teamId].rosterPlayerIds
      .map((playerId) => game.players[playerId].contractId)
      .filter(Boolean)
      .map((contractId) => game.contracts[contractId!].annualSalary);
    const averageRosterSalary = rosterContracts.reduce((sum, salary) => sum + salary, 0) / rosterContracts.length;
    const unsignedPlayer = Object.values(game.players).find((player) => !player.currentTeamId && player.status === "freeAgent")!;
    const projectedSalary = getStartingAnnualSalary(unsignedPlayer);

    expect(projectedSalary).toBeGreaterThan(12000);
    expect(projectedSalary).toBeLessThan(averageRosterSalary * 1.8);
  });
});
