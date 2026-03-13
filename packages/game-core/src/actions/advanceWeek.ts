import { GameState } from "../types/gameState";
import { simulateGame } from "../sim/simulateGame";

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

export function advanceWeek(input: GameState): GameState {
  const state = clone(input);
  const week = state.world.currentWeek;

  const games = Object.values(state.schedule).filter((g) => g.week === week && g.status === "scheduled");

  for (const game of games) {
    const result = simulateGame(state, game);
    state.schedule[game.id].status = "completed";
    state.schedule[game.id].result = result;

    const standings = state.standings[game.leagueId];
    const homeRow = standings.rows.find((r) => r.teamId === game.homeTeamId)!;
    const awayRow = standings.rows.find((r) => r.teamId === game.awayTeamId)!;

    homeRow.runsFor += result.homeScore;
    homeRow.runsAgainst += result.awayScore;
    awayRow.runsFor += result.awayScore;
    awayRow.runsAgainst += result.homeScore;

    homeRow.runDifferential = homeRow.runsFor - homeRow.runsAgainst;
    awayRow.runDifferential = awayRow.runsFor - awayRow.runsAgainst;

    if (result.winningTeamId === game.homeTeamId) {
      homeRow.wins += 1;
      awayRow.losses += 1;
      homeRow.streak = homeRow.streak >= 0 ? homeRow.streak + 1 : 1;
      awayRow.streak = awayRow.streak <= 0 ? awayRow.streak - 1 : -1;
    } else {
      awayRow.wins += 1;
      homeRow.losses += 1;
      awayRow.streak = awayRow.streak >= 0 ? awayRow.streak + 1 : 1;
      homeRow.streak = homeRow.streak <= 0 ? homeRow.streak - 1 : -1;
    }

    homeRow.winPct = homeRow.wins / Math.max(1, homeRow.wins + homeRow.losses);
    awayRow.winPct = awayRow.wins / Math.max(1, awayRow.wins + awayRow.losses);

    homeRow.averageAttendance = homeRow.averageAttendance === 0
      ? result.attendance
      : Math.round((homeRow.averageAttendance + result.attendance) / 2);

    const homeFinance = state.finances[game.homeTeamId];
    homeFinance.currentCash += result.attendance * homeFinance.ticketPrice;

    state.eventLog.push({
      id: `event_${state.eventLog.length + 1}`,
      timestamp: new Date().toISOString(),
      actionType: "SIMULATE_GAME",
      payload: { gameId: game.id },
      summary: `${state.teams[game.awayTeamId].nickname} ${result.awayScore} at ${state.teams[game.homeTeamId].nickname} ${result.homeScore}`,
    });
  }

  const userFinance = state.finances[state.world.userTeamId];
  userFinance.currentCash += Math.round(userFinance.sponsorRevenueMonthly / 4);

  state.world.currentWeek += 1;
  state.world.currentDate = `2027-04-${String(Math.min(1 + (state.world.currentWeek - 1) * 7, 28)).padStart(2, "0")}`;
  state.meta.updatedAt = new Date().toISOString();

  return state;
}
