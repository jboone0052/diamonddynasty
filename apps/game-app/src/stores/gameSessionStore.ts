import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import {
  advanceWeek as advanceWeekAction,
  createLocalSaveRepository,
  createNewGame as createNewGameAction,
  GameState,
  markMailRead as markMailReadAction,
  setLineup as setLineupAction,
  setRotation as setRotationAction,
  setTicketPrice as setTicketPriceAction,
} from "@baseball-sim/game-core";

const repository = createLocalSaveRepository({
  async getItem(key) {
    if (typeof window !== "undefined" && typeof window.localStorage !== "undefined") {
      return window.localStorage.getItem(key);
    }
    return AsyncStorage.getItem(key);
  },
  async setItem(key, value) {
    if (typeof window !== "undefined" && typeof window.localStorage !== "undefined") {
      window.localStorage.setItem(key, value);
      return;
    }
    await AsyncStorage.setItem(key, value);
  },
  async removeItem(key) {
    if (typeof window !== "undefined" && typeof window.localStorage !== "undefined") {
      window.localStorage.removeItem(key);
      return;
    }
    await AsyncStorage.removeItem(key);
  },
});

type SaveSummary = { id: string; saveName: string; updatedAt: string; createdAt: string };

type GameSessionState = {
  game: GameState | null;
  saves: SaveSummary[];
  selectedSaveId: string | null;
  loading: boolean;
  error: string | null;
  refreshSaves: () => Promise<void>;
  createNewGame: () => Promise<void>;
  loadSave: (saveId: string) => Promise<void>;
  saveGame: () => Promise<void>;
  advanceWeek: () => Promise<void>;
  moveLineupPlayer: (fromIndex: number, toIndex: number) => void;
  moveRotationPlayer: (fromIndex: number, toIndex: number) => void;
  adjustTicketPrice: (delta: number) => void;
  markMessageRead: (messageId: string) => void;
};

async function persistCurrentGame(game: GameState, saveId: string | null) {
  if (saveId) {
    await repository.save(saveId, game);
    return saveId;
  }

  return repository.create(game, game.meta.saveName);
}

export const useGameSessionStore = create<GameSessionState>((set, get) => ({
  game: null,
  saves: [],
  selectedSaveId: null,
  loading: false,
  error: null,
  refreshSaves: async () => {
    const saves = await repository.list();
    set({ saves });
  },
  createNewGame: async () => {
    set({ loading: true, error: null });
    try {
      const game = createNewGameAction();
      const saveId = await repository.create(game, game.meta.saveName);
      const saves = await repository.list();
      set({ game, saves, selectedSaveId: saveId, loading: false });
    } catch (error) {
      set({ loading: false, error: error instanceof Error ? error.message : "Failed to create game." });
    }
  },
  loadSave: async (saveId: string) => {
    set({ loading: true, error: null });
    try {
      const game = await repository.load(saveId);
      const saves = await repository.list();
      set({ game, saves, selectedSaveId: saveId, loading: false });
    } catch (error) {
      set({ loading: false, error: error instanceof Error ? error.message : "Failed to load save." });
    }
  },
  saveGame: async () => {
    const current = get().game;
    if (!current) return;
    set({ loading: true, error: null });
    try {
      const saveId = await persistCurrentGame(current, get().selectedSaveId);
      const saves = await repository.list();
      set({ selectedSaveId: saveId, saves, loading: false });
    } catch (error) {
      set({ loading: false, error: error instanceof Error ? error.message : "Failed to save game." });
    }
  },
  advanceWeek: async () => {
    const current = get().game;
    if (!current) return;
    set({ loading: true, error: null });
    try {
      const game = advanceWeekAction(current);
      const saveId = await persistCurrentGame(game, get().selectedSaveId);
      await repository.autosave(game);
      const saves = await repository.list();
      set({ game, selectedSaveId: saveId, saves, loading: false });
    } catch (error) {
      set({ loading: false, error: error instanceof Error ? error.message : "Failed to advance week." });
    }
  },
  moveLineupPlayer: (fromIndex, toIndex) => {
    const current = get().game;
    if (!current) return;
    const teamId = current.world.userTeamId;
    const lineup = [...current.teams[teamId].activeLineup.battingOrderPlayerIds];
    if (toIndex < 0 || toIndex >= lineup.length || fromIndex === toIndex) return;
    const [playerId] = lineup.splice(fromIndex, 1);
    lineup.splice(toIndex, 0, playerId);
    const nextGame = setLineupAction(current, teamId, {
      ...current.teams[teamId].activeLineup,
      battingOrderPlayerIds: lineup,
    });
    set({ game: nextGame });
  },
  moveRotationPlayer: (fromIndex, toIndex) => {
    const current = get().game;
    if (!current) return;
    const teamId = current.world.userTeamId;
    const rotation = [...current.teams[teamId].rotation.starterPlayerIds];
    if (toIndex < 0 || toIndex >= rotation.length || fromIndex === toIndex) return;
    const [playerId] = rotation.splice(fromIndex, 1);
    rotation.splice(toIndex, 0, playerId);
    set({ game: setRotationAction(current, teamId, rotation) });
  },
  adjustTicketPrice: (delta) => {
    const current = get().game;
    if (!current) return;
    const teamId = current.world.userTeamId;
    const currentPrice = current.finances[teamId].ticketPrice;
    set({ game: setTicketPriceAction(current, teamId, currentPrice + delta) });
  },
  markMessageRead: (messageId) => {
    const current = get().game;
    if (!current) return;
    set({ game: markMailReadAction(current, messageId) });
  },
}));
