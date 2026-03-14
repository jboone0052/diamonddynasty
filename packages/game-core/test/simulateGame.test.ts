import { describe, expect, it } from "vitest";
import { createNewGame } from "../src/factories/createNewGame";
import { simulateGame } from "../src/sim/simulateGame";

describe("simulateGame", () => {
  it("produces a winner and consistent batting run totals", () => {
    const state = createNewGame();
    const game = Object.values(state.schedule).find((scheduledGame) => scheduledGame.week === 1)!;

    const result = simulateGame(state, game);

    expect(result.homeScore).not.toBe(result.awayScore);
    const totalRunsInBattingLines = Object.values(result.boxScore.battingLines).reduce((total, line) => total + line.runs, 0);
    expect(totalRunsInBattingLines).toBe(result.homeScore + result.awayScore);
  });

  it("tracks core box score summary counters", () => {
    const state = createNewGame();
    const game = Object.values(state.schedule).find((scheduledGame) => scheduledGame.week === 1)!;

    const result = simulateGame(state, game);

    const hitsFromBattingLines = Object.values(result.boxScore.battingLines).reduce((total, line) => total + line.hits, 0);
    const walksFromBattingLines = Object.values(result.boxScore.battingLines).reduce((total, line) => total + line.walks, 0);
    const strikeoutsFromBattingLines = Object.values(result.boxScore.battingLines).reduce((total, line) => total + line.strikeouts, 0);

    expect(result.simSummary.totalHits).toBe(hitsFromBattingLines);
    expect(result.simSummary.totalWalks).toBe(walksFromBattingLines);
    expect(result.simSummary.totalStrikeouts).toBe(strikeoutsFromBattingLines);
  });

  it("includes a play-by-play log with a final line", () => {
    const state = createNewGame();
    const game = Object.values(state.schedule).find((scheduledGame) => scheduledGame.week === 1)!;

    const result = simulateGame(state, game);

    expect(result.playByPlay).toBeDefined();
    expect(result.playByPlay?.length ?? 0).toBeGreaterThan(0);
    expect(result.playByPlay?.[result.playByPlay.length - 1]).toMatch(/^Final:/);
  });

  it("disambiguates duplicate last names in play-by-play entries", () => {
    const state = createNewGame("duplicate-last-name-seed");
    const game = Object.values(state.schedule).find((scheduledGame) => scheduledGame.week === 1)!;
    const awayBattingOrder = state.teams[game.awayTeamId].activeLineup.battingOrderPlayerIds;
    const firstBatter = state.players[awayBattingOrder[0]];
    const secondBatter = state.players[awayBattingOrder[1]];

    firstBatter.firstName = "Alex";
    firstBatter.lastName = "Walker";
    firstBatter.fullName = "Alex Walker";
    secondBatter.firstName = "Jordan";
    secondBatter.lastName = "Walker";
    secondBatter.fullName = "Jordan Walker";

    const result = simulateGame(state, game);
    const playByPlay = result.playByPlay ?? [];

    expect(playByPlay.some((entry) => entry.includes("Alex Walker"))).toBe(true);
    expect(playByPlay.some((entry) => entry.includes("Jordan Walker"))).toBe(true);
  });


  it("prevents runaway walk chains from creating absurd scores", () => {
    const state = createNewGame();
    const schedule = Object.values(state.schedule).sort((a, b) => a.week - b.week);

    for (const game of schedule) {
      const result = simulateGame(state, game);
      expect(result.homeScore).toBeLessThanOrEqual(40);
      expect(result.awayScore).toBeLessThanOrEqual(40);
    }
  });

  it("keeps aggregate run environment within a believable range", () => {
    const state = createNewGame();
    const schedule = Object.values(state.schedule).sort((a, b) => a.week - b.week);

    let totalRuns = 0;
    let totalHits = 0;

    for (const game of schedule) {
      const result = simulateGame(state, game);
      totalRuns += result.homeScore + result.awayScore;
      totalHits += result.simSummary.totalHits;
    }

    const averageRunsPerGame = totalRuns / schedule.length;
    const averageHitsPerGame = totalHits / schedule.length;

    expect(averageRunsPerGame).toBeGreaterThanOrEqual(5);
    expect(averageRunsPerGame).toBeLessThanOrEqual(12);
    expect(averageHitsPerGame).toBeGreaterThanOrEqual(8);
    expect(averageHitsPerGame).toBeLessThanOrEqual(22);
  });
});
