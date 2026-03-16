import { describe, expect, it } from "vitest";
import { createNewGame } from "../src/factories/createNewGame";
import { simulateGame } from "../src/sim/simulateGame";

function getTeamHits(state: ReturnType<typeof createNewGame>, teamId: string, battingLines: Record<string, { playerId: string; hits: number }>) {
  const rosterIds = new Set(state.teams[teamId].rosterPlayerIds);
  return Object.values(battingLines)
    .filter((line) => rosterIds.has(line.playerId))
    .reduce((total, line) => total + line.hits, 0);
}

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

  it("uses relievers once games reach the late innings", () => {
    const state = createNewGame("bullpen-usage-seed");
    const game = Object.values(state.schedule).find((scheduledGame) => scheduledGame.week === 1)!;

    const result = simulateGame(state, game);
    const pitchingIds = Object.keys(result.boxScore.pitchingLines);
    const bullpenIds = new Set([
      ...state.teams[game.homeTeamId].bullpenPlayerIds,
      ...state.teams[game.awayTeamId].bullpenPlayerIds,
    ]);

    expect(pitchingIds.length).toBeGreaterThan(2);
    expect(pitchingIds.some((playerId) => bullpenIds.has(playerId))).toBe(true);
    expect(result.playByPlay?.some((entry) => entry.startsWith("Pitching change:"))).toBe(true);
  });

  it("hooks an overwhelmed starter before the late innings in a blowout", () => {
    const state = createNewGame("early-hook-seed");
    const game = Object.values(state.schedule).find((scheduledGame) => scheduledGame.week === 1)!;
    const homeStarterId = state.teams[game.homeTeamId].rotation.starterPlayerIds[0];
    const homeStarter = state.players[homeStarterId];

    if (homeStarter.ratings.pitching) {
      homeStarter.ratings.pitching.velocity = 28;
      homeStarter.ratings.pitching.control = 26;
      homeStarter.ratings.pitching.movement = 24;
      homeStarter.ratings.pitching.stamina = 38;
    }
    homeStarter.fatigue = 92;

    state.teams[game.awayTeamId].activeLineup.battingOrderPlayerIds.forEach((playerId) => {
      const hitter = state.players[playerId];
      hitter.ratings.hitting.contact = 92;
      hitter.ratings.hitting.power = 88;
      hitter.ratings.hitting.plateDiscipline = 86;
    });

    const result = simulateGame(state, game);
    const starterLine = result.boxScore.pitchingLines[homeStarterId];
    const homePitchersUsed = Object.keys(result.boxScore.pitchingLines)
      .filter((playerId) => state.teams[game.homeTeamId].rosterPlayerIds.includes(playerId));

    expect(starterLine.inningsPitched).toBeLessThanOrEqual(6);
    expect(homePitchersUsed.length).toBeGreaterThan(1);
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

  it("keeps regulation tiebreak games to a minority of the schedule", () => {

    const state = createNewGame("late-game-balance-seed");
    const schedule = Object.values(state.schedule).sort((a, b) => a.week - b.week || a.id.localeCompare(b.id));
    let tiebreakGames = 0;

    for (const game of schedule) {
      const result = simulateGame(state, game);
      if (result.notableEvents.some((event) => event.includes("tiebreak rule"))) {
        tiebreakGames += 1;
      }
    }

    expect(tiebreakGames).toBeLessThanOrEqual(14);
  });

  it("keeps hitless losses rare across a season sample", () => {
    const state = createNewGame("contact-floor-seed");
    const schedule = Object.values(state.schedule).sort((a, b) => a.week - b.week || a.id.localeCompare(b.id));
    let loserHitlessGames = 0;

    for (const game of schedule) {
      const result = simulateGame(state, game);
      const homeHits = getTeamHits(state, game.homeTeamId, result.boxScore.battingLines);
      const awayHits = getTeamHits(state, game.awayTeamId, result.boxScore.battingLines);
      const loserHits = result.losingTeamId === game.homeTeamId ? homeHits : awayHits;
      if (loserHits === 0) {
        loserHitlessGames += 1;
      }
    }


    expect(loserHitlessGames).toBeLessThanOrEqual(2);
  });

  it("cuts attendance when ticket prices outrun local demand", () => {
    const budgetState = createNewGame("attendance-price-seed");
    const premiumState = createNewGame("attendance-price-seed");
    const budgetGame = Object.values(budgetState.schedule).find((scheduledGame) => scheduledGame.week === 1)!;
    const premiumGame = premiumState.schedule[budgetGame.id];

    budgetState.teams[budgetGame.homeTeamId].fanInterest = 38;
    premiumState.teams[premiumGame.homeTeamId].fanInterest = 38;
    budgetState.finances[budgetGame.homeTeamId].ticketPrice = 9;
    premiumState.finances[premiumGame.homeTeamId].ticketPrice = 24;

    const budgetResult = simulateGame(budgetState, budgetGame);
    const premiumResult = simulateGame(premiumState, premiumGame);

    expect(budgetResult.attendance).toBeGreaterThan(premiumResult.attendance);
  });
});


