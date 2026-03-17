import { describe, expect, it } from "vitest";
import { advanceWeek } from "../src/actions/advanceWeek";
import { createNewGame } from "../src/factories/createNewGame";
import { getLatestCompletedWeek, getPlayerHealthSnapshot, getSeasonSponsorshipSnapshot, getTeamManagementHealthSnapshot, getWeeklyResultsSnapshot } from "../src/queries";

describe("weekly results queries", () => {
  it("returns the latest completed week recap after advancing", () => {
    const updated = advanceWeek(createNewGame("results-seed"));

    const latestWeek = getLatestCompletedWeek(updated);
    const snapshot = getWeeklyResultsSnapshot(updated);

    expect(latestWeek).toBe(1);
    expect(snapshot?.week).toBe(1);
    expect(snapshot?.games.length).toBeGreaterThan(0);
    expect(snapshot?.userGame?.result).toBeDefined();
    expect(snapshot?.ranking).toBeGreaterThan(0);
  });

  it("surfaces player health risk, management warnings, and weekly injury reports", () => {
    const game = createNewGame("health-query-seed");
    const teamId = game.world.userTeamId;
    const starterId = game.teams[teamId].rotation.starterPlayerIds[0];
    const lineupPlayerId = game.teams[teamId].activeLineup.battingOrderPlayerIds[0];
    const trackedGame = Object.values(game.schedule).find((scheduledGame) => scheduledGame.week === 1 && (scheduledGame.homeTeamId === teamId || scheduledGame.awayTeamId === teamId))!;

    game.players[starterId].fatigue = 88;
    game.players[starterId].injuryProneness = 82;
    game.players[lineupPlayerId].status = "injured";
    game.teams[teamId].injuredPlayerIds = [lineupPlayerId];

    const health = getPlayerHealthSnapshot(game, starterId);
    expect(health.riskScore).toBeGreaterThanOrEqual(50);
    expect(["Elevated", "High"]).toContain(health.riskLabel);

    const management = getTeamManagementHealthSnapshot(game, teamId);
    expect(management.rotationWarnings.some((item) => item.playerId === starterId)).toBe(true);
    expect(management.lineupWarnings.some((item) => item.playerId === lineupPlayerId)).toBe(true);

    game.injuries.injury_test = {
      id: "injury_test",
      playerId: starterId,
      injuryType: "Shoulder strain",
      severity: "moderate",
      startDate: trackedGame.date,
      expectedReturnDate: trackedGame.date,
      gamesRemainingEstimate: 2,
      isActive: true,
    };
    game.players[starterId].status = "injured";
    game.teams[teamId].injuredPlayerIds = [lineupPlayerId, starterId];

    const updated = advanceWeek(game);
    const snapshot = getWeeklyResultsSnapshot(updated, 1);

    expect(snapshot?.injuryReport.userTeam.some((item) => item.player.id === starterId)).toBe(true);
  });

  it("projects the next-season sponsor deal from the finished record", () => {
    const game = createNewGame("sponsorship-summary-seed");
    const teamId = game.world.userTeamId;
    const row = game.standings[game.teams[teamId].leagueId].rows.find((item) => item.teamId === teamId)!;

    row.wins = 4;
    row.losses = 10;
    row.winPct = 0.286;

    const sponsorship = getSeasonSponsorshipSnapshot(game, teamId);

    expect(sponsorship.previousSeasonWins).toBe(1);
    expect(sponsorship.completedSeasonWins).toBe(4);
    expect(sponsorship.projectedNextSeasonBase).toBeGreaterThan(sponsorship.currentBaseRevenueMonthly);
    expect(sponsorship.projectedChange).toBeGreaterThan(0);
  });
});
