import { economyConfig } from "@baseball-sim/config";
import { describe, expect, it } from "vitest";
import {
  advanceWeek,
  createLocalSaveRepository,
  createNewGame,
  deserializeGameState,
  getPromotionStatus,
  serializeGameState,
} from "../src";

describe("season progression", () => {
  it("advances one week and records completed games", () => {
    const game = createNewGame();
    const next = advanceWeek(game);
    const completed = Object.values(next.schedule).filter((scheduledGame) => scheduledGame.week === 1 && scheduledGame.status === "completed");
    expect(completed).toHaveLength(4);
    expect(next.world.currentWeek).toBe(2);
  });


  it("records ticket income for each completed home game", () => {
    const game = createNewGame();
    const next = advanceWeek(game);
    const completedHomeGame = Object.values(next.schedule).find((scheduledGame) => scheduledGame.week === 1 && scheduledGame.status === "completed")!;
    const finance = next.finances[completedHomeGame.homeTeamId];
    const expectedTicketRevenue = completedHomeGame.result!.attendance * finance.ticketPrice * economyConfig.gamesPerSeries;

    expect(finance.lastMonthRevenueBreakdown.ticketSales).toBe(expectedTicketRevenue);
    expect(finance.lastMonthRevenueBreakdown.ticketSales).toBeGreaterThan(0);
  });

  it("can run to season completion and produce a promotion summary", () => {
    let game = createNewGame();
    for (let index = 0; index < game.world.weeksInSeason; index += 1) {
      game = advanceWeek(game);
    }
    expect(game.world.seasonStatus).toBe("completed");
    expect(game.seasonSummary).toBeDefined();
    expect(getPromotionStatus(game).seasonSummary).toBeDefined();
  });

  it("round-trips through serialization and local save repository", async () => {
    const repository = createLocalSaveRepository();
    const game = createNewGame();
    const raw = serializeGameState(game);
    expect(deserializeGameState(raw).meta.saveName).toBe(game.meta.saveName);
    const saveId = await repository.create(game, "Test Save");
    const loaded = await repository.load(saveId);
    expect(loaded.meta.saveName).toBe("Test Save");
  });
});
