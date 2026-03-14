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
    expect(averageHitsPerGame).toBeGreaterThanOrEqual(9);
    expect(averageHitsPerGame).toBeLessThanOrEqual(22);
  });
});
