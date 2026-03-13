import { GameState, Player, ScheduledGame, StandingsRow } from "./types/gameState";

export function getUserTeam(state: GameState) {
  return state.teams[state.world.userTeamId];
}

export function getDashboardSnapshot(state: GameState): {
  team: GameState["teams"][string];
  finances: GameState["finances"][string];
  standings: StandingsRow;
  nextGame?: ScheduledGame;
  unreadCount: number;
  seasonSummary: GameState["seasonSummary"];
} {
  const team = getUserTeam(state);
  const finances = state.finances[team.id];
  const standings = state.standings[team.leagueId].rows.find((row: StandingsRow) => row.teamId === team.id)!;
  const nextGame = Object.values(state.schedule)
    .filter((game: ScheduledGame) => game.status === "scheduled" && (game.homeTeamId === team.id || game.awayTeamId === team.id))
    .sort((a: ScheduledGame, b: ScheduledGame) => a.week - b.week)[0];

  return {
    team,
    finances,
    standings,
    nextGame,
    unreadCount: state.mailbox.unreadCount,
    seasonSummary: state.seasonSummary,
  };
}

export function getRosterSnapshot(state: GameState, teamId = state.world.userTeamId): {
  team: GameState["teams"][string];
  roster: Player[];
  injuredPlayers: Player[];
  reservePlayers: Player[];
} {
  const team = state.teams[teamId];
  return {
    team,
    roster: team.rosterPlayerIds.map((playerId: string) => state.players[playerId]),
    injuredPlayers: team.injuredPlayerIds.map((playerId: string) => state.players[playerId]),
    reservePlayers: team.reservePlayerIds.map((playerId: string) => state.players[playerId]),
  };
}

export function getScheduleSnapshot(state: GameState, teamId = state.world.userTeamId): ScheduledGame[] {
  return Object.values(state.schedule)
    .filter((game: ScheduledGame) => game.homeTeamId === teamId || game.awayTeamId === teamId)
    .sort((a: ScheduledGame, b: ScheduledGame) => a.week - b.week || a.date.localeCompare(b.date));
}

export function getStandingsSnapshot(state: GameState, leagueId = state.teams[state.world.userTeamId].leagueId): StandingsRow[] {
  return [...state.standings[leagueId].rows].sort((a: StandingsRow, b: StandingsRow) => b.wins - a.wins || b.runDifferential - a.runDifferential || b.runsFor - a.runsFor);
}

export function getPromotionStatus(state: GameState) {
  const league = state.leagues[state.teams[state.world.userTeamId].leagueId];
  const standing = getStandingsSnapshot(state).findIndex((row: StandingsRow) => row.teamId === state.world.userTeamId) + 1;
  const team = getUserTeam(state);
  const row = state.standings[league.id].rows.find((item: StandingsRow) => item.teamId === team.id)!;
  const finance = state.finances[team.id];
  const stadium = state.stadiums[team.stadiumId];

  return {
    currentRank: standing,
    rankRequirementMet: standing > 0 && standing <= league.promotionSpots,
    stadiumRequirementMet: stadium.capacity >= league.minStadiumCapacityForPromotion,
    attendanceRequirementMet: row.averageAttendance >= league.minAverageAttendanceForPromotion,
    cashRequirementMet: finance.currentCash >= league.minCashReserveForPromotion,
    seasonSummary: state.seasonSummary,
  };
}
