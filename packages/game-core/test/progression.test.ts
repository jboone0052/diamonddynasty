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


  it("tracks pitcher win-loss records from completed games", () => {
    const game = createNewGame();
    const next = advanceWeek(game);
    const completedGames = Object.values(next.schedule).filter((scheduledGame) => scheduledGame.week === 1 && scheduledGame.status === "completed");
    const winsByPitcher = new Map<string, number>();
    const lossesByPitcher = new Map<string, number>();

    completedGames.forEach((scheduledGame) => {
      const result = scheduledGame.result!;
      if (result.winningPitcherId) {
        winsByPitcher.set(result.winningPitcherId, (winsByPitcher.get(result.winningPitcherId) ?? 0) + 1);
      }
      if (result.losingPitcherId) {
        lossesByPitcher.set(result.losingPitcherId, (lossesByPitcher.get(result.losingPitcherId) ?? 0) + 1);
      }
    });

    winsByPitcher.forEach((wins, pitcherId) => {
      expect(next.players[pitcherId].seasonStats.wins).toBe(wins);
    });
    lossesByPitcher.forEach((losses, pitcherId) => {
      expect(next.players[pitcherId].seasonStats.losses).toBe(losses);
    });
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


  it("carries fatigue by workload while idle players recover", () => {
    const game = createNewGame("fatigue-workload-seed");
    const team = game.teams[game.world.userTeamId];
    const starterId = team.rotation.starterPlayerIds[0];
    const lineupPlayerId = team.activeLineup.battingOrderPlayerIds[0];
    const reservePlayerId = team.reservePlayerIds.find((playerId) => !team.bullpenPlayerIds.includes(playerId)) ?? team.reservePlayerIds[0];

    expect(reservePlayerId).toBeDefined();

    game.players[starterId].fatigue = 24;
    game.players[lineupPlayerId].fatigue = 24;
    game.players[reservePlayerId!].fatigue = 24;

    const next = advanceWeek(game);

    expect(next.players[starterId].fatigue).toBeGreaterThan(next.players[lineupPlayerId].fatigue);
    expect(next.players[lineupPlayerId].fatigue).toBeGreaterThan(next.players[reservePlayerId!].fatigue);
    expect(next.players[reservePlayerId!].fatigue).toBeLessThan(24);
  });


  it("feeds strong gates back into sponsors, merch, and cash", () => {
    const strongDemand = createNewGame("commercial-feedback-seed");
    const weakDemand = createNewGame("commercial-feedback-seed");
    const trackedGame = Object.values(strongDemand.schedule).find((scheduledGame) => scheduledGame.week === 1)!;
    const trackedTeamId = trackedGame.homeTeamId;

    strongDemand.teams[trackedTeamId].fanInterest = 68;
    strongDemand.teams[trackedTeamId].morale = 64;
    strongDemand.finances[trackedTeamId].ticketPrice = 10;

    weakDemand.teams[trackedTeamId].fanInterest = 22;
    weakDemand.teams[trackedTeamId].morale = 42;
    weakDemand.finances[trackedTeamId].ticketPrice = 24;

    const strongNext = advanceWeek(strongDemand);
    const weakNext = advanceWeek(weakDemand);
    const strongGame = strongNext.schedule[trackedGame.id];
    const weakGame = weakNext.schedule[trackedGame.id];

    expect(strongGame.result!.attendance).toBeGreaterThan(weakGame.result!.attendance);
    expect(strongNext.finances[trackedTeamId].sponsorRevenueMonthly).toBeGreaterThan(weakNext.finances[trackedTeamId].sponsorRevenueMonthly);
    expect(strongNext.finances[trackedTeamId].merchandiseStrength).toBeGreaterThan(weakNext.finances[trackedTeamId].merchandiseStrength);
    expect(strongNext.finances[trackedTeamId].currentCash).toBeGreaterThan(weakNext.finances[trackedTeamId].currentCash);
  });

  it("creates more pitcher injuries for overworked staffs across a season", () => {
    let stressed = createNewGame("pitcher-injury-seed");
    let rested = createNewGame("pitcher-injury-seed");

    [stressed, rested].forEach((state, index) => {
      Object.values(state.teams).forEach((team) => {
        const pitcherIds = Array.from(new Set([...team.rotation.starterPlayerIds, ...team.bullpenPlayerIds]));
        pitcherIds.forEach((playerId) => {
          const player = state.players[playerId];
          player.injuryProneness = index === 0 ? 100 : 15;
          player.fatigue = index === 0 ? 94 : 18;
          if (player.ratings.pitching) {
            player.ratings.pitching.stamina = index === 0 ? 32 : 60;
            player.ratings.pitching.control = index === 0 ? Math.max(20, player.ratings.pitching.control - 18) : player.ratings.pitching.control;
            player.ratings.pitching.movement = index === 0 ? Math.max(20, player.ratings.pitching.movement - 16) : player.ratings.pitching.movement;
          }
        });
      });
    });

    for (let week = 0; week < stressed.world.weeksInSeason; week += 1) {
      stressed = advanceWeek(stressed);
      rested = advanceWeek(rested);
    }

    const stressedPitcherInjuries = Object.values(stressed.injuries).filter((injury) => {
      const player = stressed.players[injury.playerId];
      return player.primaryPosition === "SP" || player.primaryPosition === "RP";
    }).length;
    const restedPitcherInjuries = Object.values(rested.injuries).filter((injury) => {
      const player = rested.players[injury.playerId];
      return player.primaryPosition === "SP" || player.primaryPosition === "RP";
    }).length;

    expect(stressedPitcherInjuries).toBeGreaterThan(restedPitcherInjuries);
    expect(stressedPitcherInjuries).toBeGreaterThan(0);
  });

  it("recovers injuries faster with better medical support and lower fatigue", () => {
    const fastRecovery = createNewGame("injury-recovery-seed");
    const slowRecovery = createNewGame("injury-recovery-seed");
    const teamId = fastRecovery.world.userTeamId;
    const playerId = fastRecovery.teams[teamId].activeLineup.battingOrderPlayerIds[0];
    const injuryId = "injury_test_recovery";

    [fastRecovery, slowRecovery].forEach((state) => {
      state.injuries[injuryId] = {
        id: injuryId,
        playerId,
        injuryType: "Wrist sprain",
        severity: "minor",
        startDate: state.world.currentDate,
        expectedReturnDate: state.world.currentDate,
        gamesRemainingEstimate: 2,
        isActive: true,
      };
      state.players[playerId].status = "injured";
      state.teams[teamId].injuredPlayerIds = [playerId];
    });

    fastRecovery.facilities[teamId].medicalFacilityLevel = 3;
    fastRecovery.players[playerId].fatigue = 28;
    slowRecovery.facilities[teamId].medicalFacilityLevel = 1;
    slowRecovery.players[playerId].fatigue = 88;

    const fastNext = advanceWeek(fastRecovery);
    const slowNext = advanceWeek(slowRecovery);

    const fastInjury = fastNext.injuries[injuryId];
    const slowInjury = slowNext.injuries[injuryId];
    const fastRemaining = fastInjury?.isActive ? fastInjury.gamesRemainingEstimate : 0;
    const slowRemaining = slowInjury?.isActive ? slowInjury.gamesRemainingEstimate : 0;

    expect(fastRemaining).toBeLessThan(slowRemaining);
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

    const userFinance = game.finances[game.world.userTeamId];
    const seasonRevenue = Object.values(userFinance.seasonRevenueBreakdown).reduce((sum, value) => sum + value, 0);
    const seasonExpenses = Object.values(userFinance.seasonExpenseBreakdown).reduce((sum, value) => sum + value, 0);

    expect(seasonRevenue).toBeGreaterThan(0);
    expect(seasonExpenses).toBeGreaterThan(0);
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



