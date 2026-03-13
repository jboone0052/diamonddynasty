import { GameResult, GameState, ScheduledGame } from "../types/gameState";
import { randomInt } from "../utils/rng";

export function simulateGame(state: GameState, game: ScheduledGame): GameResult {
  const homeBase = randomInt(state.rng.seed, state.rng.step + 1, 1, 8);
  const awayBase = randomInt(state.rng.seed, state.rng.step + 2, 1, 8);

  const attendanceBase = Math.round(
    (state.teams[game.homeTeamId].fanInterest / 100) *
    state.stadiums[state.teams[game.homeTeamId].stadiumId].capacity
  );

  const homeScore = homeBase >= awayBase ? homeBase : awayBase + 1;
  const awayScore = homeScore === homeBase ? awayBase : awayBase;

  return {
    homeScore,
    awayScore,
    winningTeamId: homeScore > awayScore ? game.homeTeamId : game.awayTeamId,
    losingTeamId: homeScore > awayScore ? game.awayTeamId : game.homeTeamId,
    attendance: Math.max(100, attendanceBase),
  };
}
