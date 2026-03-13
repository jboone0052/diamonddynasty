import { create } from "zustand";
import {
  GameState,
  advanceWeek,
  createNewGame,
} from "@baseball-sim/game-core";

type GameSessionState = {
  game: GameState | null;
  createNewGame: () => void;
  advanceWeek: () => void;
};

export const useGameSessionStore = create<GameSessionState>((set, get) => ({
  game: null,
  createNewGame: () => {
    set({ game: createNewGame() });
  },
  advanceWeek: () => {
    const current = get().game;
    if (!current) return;
    set({ game: advanceWeek(current) });
  },
}));
