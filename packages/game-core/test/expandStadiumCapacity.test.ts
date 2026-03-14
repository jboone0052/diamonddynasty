import { describe, expect, it } from "vitest";
import { economyConfig } from "@baseball-sim/config";
import { createNewGame } from "../src/factories/createNewGame";
import { expandStadiumCapacity } from "../src/actions/expandStadiumCapacity";

describe("expandStadiumCapacity", () => {
  it("increases capacity, upkeep, and upgrade level while deducting cash", () => {
    const game = createNewGame();
    const teamId = game.world.userTeamId;
    const team = game.teams[teamId];
    const startingCapacity = game.stadiums[team.stadiumId].capacity;
    const startingCash = game.finances[teamId].currentCash;
    const startingUpkeep = game.finances[teamId].facilityUpkeepMonthly;
    const startingLevel = game.facilities[teamId].stadiumUpgradeLevel;

    const next = expandStadiumCapacity(game, teamId);

    expect(next.stadiums[team.stadiumId].capacity).toBe(startingCapacity + economyConfig.stadiumExpansionSeatsPerUpgrade);
    expect(next.facilities[teamId].stadiumUpgradeLevel).toBe(startingLevel + 1);
    expect(next.finances[teamId].facilityUpkeepMonthly).toBe(
      startingUpkeep + economyConfig.stadiumExpansionSeatsPerUpgrade * economyConfig.stadiumExpansionUpkeepPerSeatMonthly,
    );
    expect(next.finances[teamId].currentCash).toBeLessThan(startingCash);
    expect(next.teams[teamId].cash).toBe(next.finances[teamId].currentCash);
  });

  it("throws when the team cannot afford the upgrade", () => {
    const game = createNewGame();
    const teamId = game.world.userTeamId;
    game.finances[teamId].currentCash = 0;

    expect(() => expandStadiumCapacity(game, teamId)).toThrow("Insufficient cash to expand stadium");
  });
});
