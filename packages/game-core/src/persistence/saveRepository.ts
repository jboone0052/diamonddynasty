import { GameState } from "../types/gameState";
import { GameStateSchema } from "../schemas/gameStateSchema";

const CURRENT_SCHEMA_VERSION = 2;
const SAVE_INDEX_KEY = "baseball-sim:save-index";
const SAVE_PREFIX = "baseball-sim:save:";

type SaveIndexEntry = {
  id: string;
  saveName: string;
  updatedAt: string;
  createdAt: string;
};

export type SaveSummary = SaveIndexEntry;

export type SaveStorageAdapter = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
};

function createEmptyRevenueBreakdown() {
  return {
    ticketSales: 0,
    sponsorships: 0,
    merchandise: 0,
    playoffRevenue: 0,
    transferFees: 0,
    other: 0,
  };
}

function createEmptyExpenseBreakdown() {
  return {
    payroll: 0,
    staff: 0,
    travel: 0,
    upkeep: 0,
    scouting: 0,
    marketing: 0,
    debtService: 0,
    other: 0,
  };
}

function createMemoryStorage(): SaveStorageAdapter {
  const store = new Map<string, string>();
  return {
    async getItem(key) {
      return store.get(key) ?? null;
    },
    async setItem(key, value) {
      store.set(key, value);
    },
    async removeItem(key) {
      store.delete(key);
    },
  };
}

function createDefaultStorage(): SaveStorageAdapter {
  const localStorageRef = typeof globalThis !== "undefined" && "localStorage" in globalThis
    ? (globalThis.localStorage as Storage)
    : undefined;

  if (!localStorageRef) {
    return createMemoryStorage();
  }

  return {
    async getItem(key) {
      return localStorageRef.getItem(key);
    },
    async setItem(key, value) {
      localStorageRef.setItem(key, value);
    },
    async removeItem(key) {
      localStorageRef.removeItem(key);
    },
  };
}

function normalizeFinanceState(save: Record<string, unknown>) {
  const rawFinances = save.finances;
  if (!rawFinances || typeof rawFinances !== "object") {
    return;
  }

  Object.values(rawFinances as Record<string, Record<string, unknown>>).forEach((finance) => {
    if (!finance || typeof finance !== "object") {
      return;
    }

    if (!finance.seasonRevenueBreakdown) {
      finance.seasonRevenueBreakdown = createEmptyRevenueBreakdown();
    }
    if (!finance.seasonExpenseBreakdown) {
      finance.seasonExpenseBreakdown = createEmptyExpenseBreakdown();
    }
  });
}

export function serializeGameState(state: GameState): string {
  return JSON.stringify(state);
}

export function migrateGameState(save: unknown): GameState {
  const normalized = save as Record<string, unknown>;
  if (normalized && typeof normalized === "object") {
    normalizeFinanceState(normalized);
  }

  const parsed = GameStateSchema.parse(normalized) as GameState;
  if (parsed.meta.schemaVersion !== CURRENT_SCHEMA_VERSION) {
    parsed.meta.schemaVersion = CURRENT_SCHEMA_VERSION;
  }
  return parsed;
}

export function deserializeGameState(raw: string): GameState {
  return migrateGameState(JSON.parse(raw));
}

async function loadSaveIndex(storage: SaveStorageAdapter): Promise<SaveIndexEntry[]> {
  const raw = await storage.getItem(SAVE_INDEX_KEY);
  if (!raw) {
    return [];
  }

  const parsed = JSON.parse(raw) as SaveIndexEntry[];
  return parsed.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

async function writeSaveIndex(storage: SaveStorageAdapter, entries: SaveIndexEntry[]) {
  await storage.setItem(SAVE_INDEX_KEY, JSON.stringify(entries));
}

export function createLocalSaveRepository(storage: SaveStorageAdapter = createDefaultStorage()) {
  return {
    async create(state: GameState, saveName = state.meta.saveName) {
      const saveId = `save_${Date.now()}`;
      const nextState = { ...state, meta: { ...state.meta, saveName } };
      await this.save(saveId, nextState);
      return saveId;
    },
    async save(saveId: string, state: GameState) {
      const serialized = serializeGameState(state);
      await storage.setItem(`${SAVE_PREFIX}${saveId}`, serialized);
      const entries = await loadSaveIndex(storage);
      const nextEntry = {
        id: saveId,
        saveName: state.meta.saveName,
        updatedAt: state.meta.updatedAt,
        createdAt: state.meta.createdAt,
      };
      const nextEntries = [...entries.filter((entry) => entry.id !== saveId), nextEntry].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
      await writeSaveIndex(storage, nextEntries);
      return nextEntry;
    },
    async load(saveId: string) {
      const raw = await storage.getItem(`${SAVE_PREFIX}${saveId}`);
      if (!raw) {
        throw new Error(`Save ${saveId} not found.`);
      }
      return deserializeGameState(raw);
    },
    async list() {
      return loadSaveIndex(storage);
    },
    async autosave(state: GameState) {
      return this.save("autosave", { ...state, meta: { ...state.meta, saveName: "Autosave" } });
    },
    async remove(saveId: string) {
      await storage.removeItem(`${SAVE_PREFIX}${saveId}`);
      const entries = await loadSaveIndex(storage);
      await writeSaveIndex(storage, entries.filter((entry) => entry.id !== saveId));
    },
    async clearAll() {
      const entries = await loadSaveIndex(storage);
      const uniqueSaveIds = new Set(entries.map((entry) => entry.id));
      uniqueSaveIds.add("autosave");

      for (const saveId of uniqueSaveIds) {
        await storage.removeItem(`${SAVE_PREFIX}${saveId}`);
      }

      await storage.removeItem(SAVE_INDEX_KEY);
    },
  };
}
