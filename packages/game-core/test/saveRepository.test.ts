import { describe, expect, it } from "vitest";
import { createNewGame } from "../src/factories/createNewGame";
import { createLocalSaveRepository } from "../src/persistence/saveRepository";

describe("saveRepository", () => {
  it("clears all saves and autosave entries", async () => {
    const storage = new Map<string, string>();
    const repository = createLocalSaveRepository({
      async getItem(key) {
        return storage.get(key) ?? null;
      },
      async setItem(key, value) {
        storage.set(key, value);
      },
      async removeItem(key) {
        storage.delete(key);
      },
    });

    const game = createNewGame();
    const saveId = await repository.create(game, "Test Save");
    await repository.autosave(game);

    expect(await repository.list()).toHaveLength(2);
    expect(storage.has(`baseball-sim:save:${saveId}`)).toBe(true);
    expect(storage.has("baseball-sim:save:autosave")).toBe(true);

    await repository.clearAll();

    expect(await repository.list()).toHaveLength(0);
    expect(storage.has(`baseball-sim:save:${saveId}`)).toBe(false);
    expect(storage.has("baseball-sim:save:autosave")).toBe(false);
    expect(storage.has("baseball-sim:save-index")).toBe(false);
  });
});
