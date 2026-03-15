import { economyConfig } from "@baseball-sim/config";
import { describe, expect, it } from "vitest";
import {
  advanceWeek,
  createLocalSaveRepository,
  expandStadiumCapacity,
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


  it("persists batting stats like hits, homers, walks, strikeouts, and batting average", () => {
    const game = createNewGame();
    const next = advanceWeek(game);
    const userTeamId = next.world.userTeamId;
    const roster = next.teams[userTeamId].rosterPlayerIds.map((playerId) => next.players[playerId]);

    const playersWithPlateAppearances = roster.filter((player) => player.seasonStats.atBats + player.seasonStats.walks > 0);
    expect(playersWithPlateAppearances.length).toBeGreaterThan(0);
    playersWithPlateAppearances.forEach((player) => {
      expect(player.seasonStats.games).toBeGreaterThan(0);
      expect(player.seasonStats.hits).toBeGreaterThanOrEqual(0);
      expect(player.seasonStats.homeRuns).toBeGreaterThanOrEqual(0);
      expect(player.seasonStats.walks).toBeGreaterThanOrEqual(0);
      expect(player.seasonStats.strikeouts).toBeGreaterThanOrEqual(0);
      expect(player.seasonStats.battingAverage).toBeGreaterThanOrEqual(0);
      expect(player.seasonStats.battingAverage).toBeLessThanOrEqual(1);
    });
  });


  it("keeps enough cash to satisfy promotion reserves after required stadium upgrades", () => {
    let game = createNewGame();
    const teamId = game.world.userTeamId;
    const league = game.leagues[game.teams[teamId].leagueId];

    while (game.stadiums[game.teams[teamId].stadiumId].capacity < league.minStadiumCapacityForPromotion) {
      game = expandStadiumCapacity(game, teamId);
    }

    for (let index = 0; index < game.world.weeksInSeason; index += 1) {
      game = advanceWeek(game);
    }

    const status = getPromotionStatus(game);
    expect(status.stadiumRequirementMet).toBe(true);
    expect(status.cashRequirementMet).toBe(true);
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
