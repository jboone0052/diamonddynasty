import { GameState } from "../types/gameState";
import { GameStateSchema } from "../schemas/gameStateSchema";

export function serializeGameState(state: GameState): string {
  return JSON.stringify(state);
}

export function deserializeGameState(raw: string): GameState {
  const parsed = JSON.parse(raw);
  return GameStateSchema.parse(parsed) as GameState;
}
