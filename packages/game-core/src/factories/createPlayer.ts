import { Player, PlayerPosition } from "../types/gameState";
import { randomInt } from "../utils/rng";

const FIRST_NAMES = ["Jake", "Luis", "Marcus", "Evan", "Noah", "Theo", "Ryan", "Caleb", "Andre", "Mason", "Elias", "Jonah"];
const LAST_NAMES = ["Morales", "Carter", "Shaw", "Bennett", "Lopez", "Walker", "Reyes", "Coleman", "Brooks", "Diaz", "Foster", "Ramirez"];
const NATIONALITIES = ["USA", "Dominican Republic", "Venezuela", "Canada", "Mexico"];
const POSITIONS: PlayerPosition[] = ["SP", "RP", "C", "1B", "2B", "3B", "SS", "LF", "CF", "RF", "DH"];
const HNDS = ["L", "R", "S"] as const;

function createEmptyStats() {
  return {
    games: 0,
    atBats: 0,
    runs: 0,
    hits: 0,
    runsBattedIn: 0,
    walks: 0,
    strikeouts: 0,
    doubles: 0,
    triples: 0,
    homeRuns: 0,
    stolenBases: 0,
    inningsPitched: 0,
    wins: 0,
    losses: 0,
    saves: 0,
    hitsAllowed: 0,
    earnedRuns: 0,
    walksAllowed: 0,
    strikeoutsPitched: 0,
    homeRunsAllowed: 0,
  };
}

export function createPlayer(id: string, seed: string, stepOffset: number, teamId?: string, primaryPositionOverride?: PlayerPosition): Player {
  const firstName = FIRST_NAMES[randomInt(seed, stepOffset + 1, 0, FIRST_NAMES.length - 1)];
  const lastName = LAST_NAMES[randomInt(seed, stepOffset + 2, 0, LAST_NAMES.length - 1)];
  const primaryPosition = primaryPositionOverride ?? POSITIONS[randomInt(seed, stepOffset + 3, 0, POSITIONS.length - 1)];
  const overall = randomInt(seed, stepOffset + 4, 38, 68);
  const potential = Math.min(99, overall + randomInt(seed, stepOffset + 5, 5, 22));
  const secondaryPositions = POSITIONS.filter((position) => position !== primaryPosition).slice(0, randomInt(seed, stepOffset + 6, 1, 2));

  return {
    id,
    firstName,
    lastName,
    fullName: `${firstName} ${lastName}`,
    age: randomInt(seed, stepOffset + 7, 19, 33),
    bats: HNDS[randomInt(seed, stepOffset + 8, 0, HNDS.length - 1)],
    throws: HNDS[randomInt(seed, stepOffset + 9, 0, 1)],
    nationality: NATIONALITIES[randomInt(seed, stepOffset + 10, 0, NATIONALITIES.length - 1)],
    primaryPosition,
    secondaryPositions,
    overall,
    potential,
    morale: randomInt(seed, stepOffset + 11, 45, 70),
    fatigue: randomInt(seed, stepOffset + 12, 0, 10),
    injuryProneness: randomInt(seed, stepOffset + 13, 15, 70),
    ratings: {
      hitting: {
        contact: randomInt(seed, stepOffset + 14, 30, 80),
        power: randomInt(seed, stepOffset + 15, 25, 80),
        plateDiscipline: randomInt(seed, stepOffset + 16, 30, 80),
        clutch: randomInt(seed, stepOffset + 17, 30, 80),
      },
      defense: {
        fielding: randomInt(seed, stepOffset + 18, 30, 80),
        range: randomInt(seed, stepOffset + 19, 30, 80),
        arm: randomInt(seed, stepOffset + 20, 30, 80),
        catcherFraming: primaryPosition === "C" ? randomInt(seed, stepOffset + 21, 35, 85) : undefined,
      },
      speed: {
        speed: randomInt(seed, stepOffset + 22, 30, 80),
        stealing: randomInt(seed, stepOffset + 23, 20, 80),
        baserunningIQ: randomInt(seed, stepOffset + 24, 25, 80),
      },
      pitching: primaryPosition === "SP" || primaryPosition === "RP" ? {
        velocity: randomInt(seed, stepOffset + 25, 35, 85),
        control: randomInt(seed, stepOffset + 26, 30, 80),
        movement: randomInt(seed, stepOffset + 27, 30, 80),
        stamina: randomInt(seed, stepOffset + 28, primaryPosition === "SP" ? 50 : 35, 85),
        holdRunners: randomInt(seed, stepOffset + 29, 25, 80),
      } : undefined,
    },
    personality: {
      loyalty: randomInt(seed, stepOffset + 30, 20, 90),
      greed: randomInt(seed, stepOffset + 31, 20, 90),
      leadership: randomInt(seed, stepOffset + 32, 20, 90),
      workEthic: randomInt(seed, stepOffset + 33, 20, 90),
      competitiveness: randomInt(seed, stepOffset + 34, 20, 90),
      consistency: randomInt(seed, stepOffset + 35, 20, 90),
    },
    development: {
      growthRate: randomInt(seed, stepOffset + 36, 85, 120) / 100,
      declineRate: randomInt(seed, stepOffset + 37, 80, 120) / 100,
      peakAgeStart: randomInt(seed, stepOffset + 38, 25, 27),
      peakAgeEnd: randomInt(seed, stepOffset + 39, 29, 32),
    },
    currentTeamId: teamId,
    serviceTimeDays: randomInt(seed, stepOffset + 40, 0, 500),
    isRetiringAfterSeason: randomInt(seed, stepOffset + 41, 0, 100) > 97,
    status: teamId ? "active" : "freeAgent",
    seasonStats: createEmptyStats(),
    careerStats: createEmptyStats(),
  };
}
