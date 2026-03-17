import { completeFtueStep } from "../ftue";
import { FtueStep, GameState } from "../types/gameState";

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

export function acknowledgeFtueStep(input: GameState, step: FtueStep): GameState {
  const state = clone(input);
  state.meta.updatedAt = new Date().toISOString();
  completeFtueStep(state, step, `FTUE progressed past ${step}.`);
  return state;
}
