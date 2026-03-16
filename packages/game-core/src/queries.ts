import { GameState, Player, ScheduledGame, StandingsRow } from "./types/gameState";

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function getActiveInjuryRecord(state: GameState, playerId: string) {
  return Object.values(state.injuries).find((injury) => injury.isActive && injury.playerId === playerId);
}

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

export function getPlayerHealthSnapshot(state: GameState, playerId: string) {
  const player = state.players[playerId];
  const activeInjury = getActiveInjuryRecord(state, playerId);
  const hasInjuryStatus = player.status === "injured";
  const medicalSupportLevel = player.currentTeamId ? (state.facilities[player.currentTeamId]?.medicalFacilityLevel ?? 1) : 1;
  const rolePressure = player.primaryPosition === "SP" || player.primaryPosition === "RP" ? 10 : player.primaryPosition === "C" ? 6 : 0;
  const riskScore = activeInjury || hasInjuryStatus
    ? 0
    : clamp(Math.round((player.fatigue * 0.62) + (player.injuryProneness * 0.34) + rolePressure - ((medicalSupportLevel - 1) * 4)), 0, 100);
  const riskLabel = activeInjury || hasInjuryStatus
    ? "Injured"
    : riskScore >= 75
      ? "High"
      : riskScore >= 50
        ? "Elevated"
        : riskScore >= 30
          ? "Watch"
          : "Low";
  const factors: string[] = [];
  if (!activeInjury && !hasInjuryStatus) {
    if (player.fatigue >= 80) factors.push(`Fatigue ${player.fatigue}`);
    if (player.injuryProneness >= 70) factors.push(`Proneness ${player.injuryProneness}`);
    if ((player.primaryPosition === "SP" || player.primaryPosition === "RP") && player.fatigue >= 68) factors.push("Pitching workload");
    if (player.primaryPosition === "C") factors.push("Catching load");
    if (factors.length === 0) factors.push("No immediate red flags");
  }

  return {
    playerId,
    riskScore,
    riskLabel,
    factors,
    activeInjury,
    medicalSupportLevel,
    recoverySummary: activeInjury ? `${activeInjury.severity[0].toUpperCase()}${activeInjury.severity.slice(1)} injury, ${activeInjury.gamesRemainingEstimate} week(s) remaining` : hasInjuryStatus ? "Injury status active, return timeline pending" : null,
    recoveryOutlook: activeInjury ? `Medical L${medicalSupportLevel} | Return target ${activeInjury.expectedReturnDate}` : hasInjuryStatus ? `Medical L${medicalSupportLevel} | Await staff update` : null,
  };
}

export function getTeamManagementHealthSnapshot(state: GameState, teamId = state.world.userTeamId) {
  const team = state.teams[teamId];
  const lineupWarnings = team.activeLineup.battingOrderPlayerIds
    .map((playerId, index) => ({ player: state.players[playerId], health: getPlayerHealthSnapshot(state, playerId), slot: index + 1 }))
    .filter(({ health }) => health.riskLabel === "Injured" || health.riskScore >= 50)
    .map(({ player, health, slot }) => ({
      playerId: player.id,
      slot,
      playerName: player.fullName,
      riskLabel: health.riskLabel,
      summary: health.activeInjury
        ? `${player.fullName} is still injured and should not be in the batting order.`
        : `${player.fullName} carries ${health.riskLabel.toLowerCase()} injury risk (${health.factors.join(", ")}).`,
    }));

  const rotationWarnings = team.rotation.starterPlayerIds
    .map((playerId, index) => ({ player: state.players[playerId], health: getPlayerHealthSnapshot(state, playerId), slot: index + 1 }))
    .filter(({ health }) => health.riskLabel === "Injured" || health.riskScore >= 50)
    .map(({ player, health, slot }) => ({
      playerId: player.id,
      slot,
      playerName: player.fullName,
      riskLabel: health.riskLabel,
      summary: health.activeInjury
        ? `${player.fullName} is injured and should not remain in the rotation.`
        : `${player.fullName} is lined up as Starter ${slot} with ${health.riskLabel.toLowerCase()} injury risk (${health.factors.join(", ")}).`,
    }));

  return { lineupWarnings, rotationWarnings };
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

export function getLatestCompletedWeek(state: GameState) {
  const completedWeeks = Object.values(state.schedule)
    .filter((game: ScheduledGame) => game.status === "completed")
    .map((game: ScheduledGame) => game.week);

  if (completedWeeks.length === 0) {
    return null;
  }

  return Math.max(...completedWeeks);
}

export function getWeeklyResultsSnapshot(state: GameState, requestedWeek?: number) {
  const latestWeek = getLatestCompletedWeek(state);
  const resolvedWeek = requestedWeek ?? latestWeek;

  if (!resolvedWeek) {
    return null;
  }

  const leagueId = state.teams[state.world.userTeamId].leagueId;
  const games = Object.values(state.schedule)
    .filter((game: ScheduledGame) => game.leagueId === leagueId && game.week === resolvedWeek && game.status === "completed" && game.result)
    .sort((a: ScheduledGame, b: ScheduledGame) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));

  if (games.length === 0) {
    return null;
  }

  const userTeamId = state.world.userTeamId;
  const userGame = games.find((game) => game.homeTeamId === userTeamId || game.awayTeamId === userTeamId);
  const totalRuns = games.reduce((sum, game) => sum + (game.result?.homeScore ?? 0) + (game.result?.awayScore ?? 0), 0);
  const totalAttendance = games.reduce((sum, game) => sum + (game.result?.attendance ?? 0), 0);
  const standings = getStandingsSnapshot(state, leagueId);
  const standingsRow = standings.find((row) => row.teamId === userTeamId)!;
  const ranking = standings.findIndex((row) => row.teamId === userTeamId) + 1;
  const weekDates = new Set(games.map((game) => game.date));
  const injuriesThisWeek = Object.values(state.injuries)
    .filter((injury) => weekDates.has(injury.startDate))
    .map((injury) => {
      const player = state.players[injury.playerId];
      const team = player.currentTeamId ? state.teams[player.currentTeamId] : undefined;
      return { injury, player, team };
    });
  const userGameTeamIds = userGame ? [userGame.homeTeamId, userGame.awayTeamId] : [userTeamId];
  const userTeamInjuries = injuriesThisWeek.filter((item) => item.team?.id === userTeamId);
  const userGameInjuries = injuriesThisWeek.filter((item) => item.team && userGameTeamIds.includes(item.team.id));

  return {
    week: resolvedWeek,
    games,
    userGame,
    totalRuns,
    totalAttendance,
    averageAttendance: Math.round(totalAttendance / games.length),
    standingsRow,
    ranking,
    injuryReport: {
      userTeam: userTeamInjuries,
      userGame: userGameInjuries,
    },
    seasonSummary: state.seasonSummary,
  };
}


