import { Player } from "../types/gameState";
import { randomInt } from "../utils/rng";

const FIRST_NAMES = ["Jake", "Luis", "Marcus", "Evan", "Noah", "Theo", "Ryan", "Caleb", "Andre", "Mason"];
const LAST_NAMES = ["Morales", "Carter", "Shaw", "Bennett", "Lopez", "Walker", "Reyes", "Coleman", "Brooks", "Diaz"];
const POSITIONS: Player["primaryPosition"][] = ["SP", "RP", "C", "1B", "2B", "3B", "SS", "LF", "CF", "RF", "DH"];

export function createPlayer(id: string, seed: string, stepOffset: number, teamId?: string): Player {
  const firstName = FIRST_NAMES[randomInt(seed, stepOffset + 1, 0, FIRST_NAMES.length - 1)];
  const lastName = LAST_NAMES[randomInt(seed, stepOffset + 2, 0, LAST_NAMES.length - 1)];
  const primaryPosition = POSITIONS[randomInt(seed, stepOffset + 3, 0, POSITIONS.length - 1)];
  const overall = randomInt(seed, stepOffset + 4, 38, 68);
  const potential = Math.min(99, overall + randomInt(seed, stepOffset + 5, 5, 20));

  return {
    id,
    firstName,
    lastName,
    fullName: `${firstName} ${lastName}`,
    age: randomInt(seed, stepOffset + 6, 19, 33),
    primaryPosition,
    overall,
    potential,
    morale: randomInt(seed, stepOffset + 7, 45, 70),
    fatigue: randomInt(seed, stepOffset + 8, 0, 10),
    ratings: {
      hitting: {
        contact: randomInt(seed, stepOffset + 9, 30, 80),
        power: randomInt(seed, stepOffset + 10, 25, 80),
        plateDiscipline: randomInt(seed, stepOffset + 11, 30, 80),
        clutch: randomInt(seed, stepOffset + 12, 30, 80),
      },
      defense: {
        fielding: randomInt(seed, stepOffset + 13, 30, 80),
        range: randomInt(seed, stepOffset + 14, 30, 80),
        arm: randomInt(seed, stepOffset + 15, 30, 80),
      },
      speed: {
        speed: randomInt(seed, stepOffset + 16, 30, 80),
        stealing: randomInt(seed, stepOffset + 17, 20, 80),
        baserunningIQ: randomInt(seed, stepOffset + 18, 25, 80),
      },
      pitching: primaryPosition === "SP" || primaryPosition === "RP" ? {
        velocity: randomInt(seed, stepOffset + 19, 35, 85),
        control: randomInt(seed, stepOffset + 20, 30, 80),
        movement: randomInt(seed, stepOffset + 21, 30, 80),
        stamina: randomInt(seed, stepOffset + 22, 35, 85),
        holdRunners: randomInt(seed, stepOffset + 23, 25, 80),
      } : undefined,
    },
    personality: {
      loyalty: randomInt(seed, stepOffset + 24, 20, 90),
      greed: randomInt(seed, stepOffset + 25, 20, 90),
      leadership: randomInt(seed, stepOffset + 26, 20, 90),
      workEthic: randomInt(seed, stepOffset + 27, 20, 90),
      competitiveness: randomInt(seed, stepOffset + 28, 20, 90),
      consistency: randomInt(seed, stepOffset + 29, 20, 90),
    },
    currentTeamId: teamId,
    status: teamId ? "active" : "freeAgent",
    seasonStats: {
      games: 0,
      hits: 0,
      homeRuns: 0,
      runsBattedIn: 0,
      inningsPitched: 0,
      strikeoutsPitched: 0,
    },
  };
}
