import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import {
  advanceWeek as advanceWeekAction,
  completeIntro as completeIntroAction,
  createLocalSaveRepository,
  createNewGame as createNewGameAction,
  expandStadiumCapacity as expandStadiumCapacityAction,
  GameState,
  getTeamManagementHealthSnapshot,
  markMailRead as markMailReadAction,
  releasePlayer as releasePlayerAction,
  scoutProspect as scoutProspectAction,
  signFreeAgent as signFreeAgentAction,
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

type AdvanceWeekConfirmation = {
  injuredLineupCount: number;
  injuredRotationCount: number;
  highRiskLineupCount: number;
  highRiskRotationCount: number;
  message: string;
};

type GameSessionState = {
  game: GameState | null;
  saves: SaveSummary[];
  selectedSaveId: string | null;
  loading: boolean;
  error: string | null;
  advanceWeekConfirmation: AdvanceWeekConfirmation | null;
  refreshSaves: () => Promise<void>;
  createNewGame: () => Promise<void>;
  completeIntro: () => Promise<void>;
  loadSave: (saveId: string) => Promise<void>;
  deleteSave: (saveId: string) => Promise<void>;
  saveGame: () => Promise<void>;
  clearLocalStorage: () => Promise<void>;
  advanceWeek: (force?: boolean) => Promise<boolean>;
  dismissAdvanceWeekConfirmation: () => void;
  moveLineupPlayer: (fromIndex: number, toIndex: number) => void;
  replaceLineupPlayer: (lineupIndex: number, playerId: string) => void;
  moveRotationPlayer: (fromIndex: number, toIndex: number) => void;
  adjustTicketPrice: (delta: number) => void;
  expandStadiumCapacity: () => void;
  markMessageRead: (messageId: string) => void;
  releasePlayer: (playerId: string) => void;
  scoutProspect: (playerId: string) => Promise<void>;
  signFreeAgent: (playerId: string) => void;
};

async function persistCurrentGame(game: GameState, saveId: string | null) {
  if (saveId) {
    await repository.save(saveId, game);
    return saveId;
  }

  return repository.create(game, game.meta.saveName);
}

function buildAdvanceWeekConfirmation(game: GameState): AdvanceWeekConfirmation | null {
  const health = getTeamManagementHealthSnapshot(game);
  const injuredLineupCount = health.lineupWarnings.filter((item) => item.riskLabel === "Injured").length;
  const injuredRotationCount = health.rotationWarnings.filter((item) => item.riskLabel === "Injured").length;
  const highRiskLineupCount = health.lineupWarnings.filter((item) => item.riskLabel === "High").length;
  const highRiskRotationCount = health.rotationWarnings.filter((item) => item.riskLabel === "High").length;

  if (injuredLineupCount === 0 && injuredRotationCount === 0) {
    return null;
  }

  return {
    injuredLineupCount,
    injuredRotationCount,
    highRiskLineupCount,
    highRiskRotationCount,
    message: `You still have ${injuredLineupCount} injured lineup player(s) and ${injuredRotationCount} injured starter(s) assigned. Advance again to continue anyway, or fix the lineup first.`,
  };
}

export const useGameSessionStore = create<GameSessionState>((set, get) => ({
  game: null,
  saves: [],
  selectedSaveId: null,
  loading: false,
  error: null,
  advanceWeekConfirmation: null,
  refreshSaves: async () => {
    const saves = await repository.list();
    set({ saves });
  },
  createNewGame: async () => {
    set({ loading: true, error: null, advanceWeekConfirmation: null });
    try {
      const game = createNewGameAction();
      const saveId = await repository.create(game, game.meta.saveName);
      const saves = await repository.list();
      set({ game, saves, selectedSaveId: saveId, loading: false, advanceWeekConfirmation: null });
    } catch (error) {
      set({ loading: false, error: error instanceof Error ? error.message : "Failed to create game." });
    }
  },
  completeIntro: async () => {
    const current = get().game;
    if (!current || current.story.introCompleted) return;
    set({ loading: true, error: null });
    try {
      const game = completeIntroAction(current);
      const saveId = await persistCurrentGame(game, get().selectedSaveId);
      const saves = await repository.list();
      set({ game, selectedSaveId: saveId, saves, loading: false, advanceWeekConfirmation: null });
    } catch (error) {
      set({ loading: false, error: error instanceof Error ? error.message : "Failed to complete intro." });
    }
  },
  loadSave: async (saveId: string) => {
    set({ loading: true, error: null, advanceWeekConfirmation: null });
    try {
      const game = await repository.load(saveId);
      const saves = await repository.list();
      set({ game, saves, selectedSaveId: saveId, loading: false, advanceWeekConfirmation: null });
    } catch (error) {
      set({ loading: false, error: error instanceof Error ? error.message : "Failed to load save." });
    }
  },
  deleteSave: async (saveId: string) => {
    set({ loading: true, error: null, advanceWeekConfirmation: null });
    try {
      await repository.remove(saveId);
      const saves = await repository.list();
      const selectedSaveId = get().selectedSaveId === saveId ? null : get().selectedSaveId;
      const game = get().selectedSaveId === saveId ? null : get().game;
      set({ game, saves, selectedSaveId, loading: false, advanceWeekConfirmation: null });
    } catch (error) {
      set({ loading: false, error: error instanceof Error ? error.message : "Failed to delete save." });
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
  clearLocalStorage: async () => {
    set({ loading: true, error: null, advanceWeekConfirmation: null });
    try {
      await repository.clearAll();
      set({ game: null, saves: [], selectedSaveId: null, loading: false, advanceWeekConfirmation: null });
    } catch (error) {
      set({ loading: false, error: error instanceof Error ? error.message : "Failed to clear local storage." });
    }
  },
  advanceWeek: async (force = false) => {
    const current = get().game;
    if (!current) return false;

    const confirmation = buildAdvanceWeekConfirmation(current);
    if (!force && confirmation) {
      set({ advanceWeekConfirmation: confirmation, error: confirmation.message });
      return false;
    }

    set({ loading: true, error: null, advanceWeekConfirmation: null });
    try {
      const game = advanceWeekAction(current);
      const saveId = await persistCurrentGame(game, get().selectedSaveId);
      await repository.autosave(game);
      const saves = await repository.list();
      set({ game, selectedSaveId: saveId, saves, loading: false, advanceWeekConfirmation: null });
      return true;
    } catch (error) {
      set({ loading: false, error: error instanceof Error ? error.message : "Failed to advance week." });
      return false;
    }
  },
  dismissAdvanceWeekConfirmation: () => {
    set((state) => ({
      advanceWeekConfirmation: null,
      error: state.error === state.advanceWeekConfirmation?.message ? null : state.error,
    }));
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
    set({ game: nextGame, advanceWeekConfirmation: null, error: null });
  },
  replaceLineupPlayer: (lineupIndex, playerId) => {
    const current = get().game;
    if (!current) return;

    const teamId = current.world.userTeamId;
    const team = current.teams[teamId];
    const lineup = [...team.activeLineup.battingOrderPlayerIds];

    if (lineupIndex < 0 || lineupIndex >= lineup.length) return;
    if (!team.rosterPlayerIds.includes(playerId)) return;
    if (lineup[lineupIndex] === playerId || lineup.includes(playerId)) return;

    lineup[lineupIndex] = playerId;

    const nextGame = setLineupAction(current, teamId, {
      ...team.activeLineup,
      battingOrderPlayerIds: lineup,
    });

    set({ game: nextGame, advanceWeekConfirmation: null, error: null });
  },
  moveRotationPlayer: (fromIndex, toIndex) => {
    const current = get().game;
    if (!current) return;
    const teamId = current.world.userTeamId;
    const rotation = [...current.teams[teamId].rotation.starterPlayerIds];
    if (toIndex < 0 || toIndex >= rotation.length || fromIndex === toIndex) return;
    const [playerId] = rotation.splice(fromIndex, 1);
    rotation.splice(toIndex, 0, playerId);
    set({ game: setRotationAction(current, teamId, rotation), advanceWeekConfirmation: null, error: null });
  },
  adjustTicketPrice: (delta) => {
    const current = get().game;
    if (!current) return;
    const teamId = current.world.userTeamId;
    const currentPrice = current.finances[teamId].ticketPrice;
    set({ game: setTicketPriceAction(current, teamId, currentPrice + delta) });
  },
  expandStadiumCapacity: () => {
    const current = get().game;
    if (!current) return;
    const teamId = current.world.userTeamId;
    try {
      set({ game: expandStadiumCapacityAction(current, teamId), error: null });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Failed to expand stadium." });
    }
  },
  markMessageRead: (messageId) => {
    const current = get().game;
    if (!current) return;
    set({ game: markMailReadAction(current, messageId) });
  },
  releasePlayer: (playerId) => {
    const current = get().game;
    if (!current) return;
    const teamId = current.world.userTeamId;
    try {
      set({ game: releasePlayerAction(current, teamId, playerId), error: null, advanceWeekConfirmation: null });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Failed to release player." });
    }
  },
  scoutProspect: async (playerId) => {
    const current = get().game;
    if (!current) return;
    const teamId = current.world.userTeamId;
    set({ loading: true, error: null });
    try {
      const game = scoutProspectAction(current, teamId, playerId);
      const saveId = await persistCurrentGame(game, get().selectedSaveId);
      const saves = await repository.list();
      set({ game, selectedSaveId: saveId, saves, loading: false, advanceWeekConfirmation: null });
    } catch (error) {
      set({ loading: false, error: error instanceof Error ? error.message : "Failed to scout player." });
    }
  },
  signFreeAgent: (playerId) => {
    const current = get().game;
    if (!current) return;
    const teamId = current.world.userTeamId;
    try {
      set({ game: signFreeAgentAction(current, teamId, playerId), error: null, advanceWeekConfirmation: null });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Failed to sign player." });
    }
  },
}));


