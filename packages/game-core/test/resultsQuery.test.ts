import { describe, expect, it } from "vitest";
import { advanceWeek } from "../src/actions/advanceWeek";
import { createNewGame } from "../src/factories/createNewGame";
import { getLatestCompletedWeek, getWeeklyResultsSnapshot } from "../src/queries";

describe("weekly results queries", () => {
  it("returns the latest completed week recap after advancing", () => {
    const updated = advanceWeek(createNewGame("results-seed"));

    const latestWeek = getLatestCompletedWeek(updated);
    const snapshot = getWeeklyResultsSnapshot(updated);

    expect(latestWeek).toBe(1);
    expect(snapshot?.week).toBe(1);
    expect(snapshot?.games.length).toBeGreaterThan(0);
    expect(snapshot?.userGame?.result).toBeDefined();
    expect(snapshot?.ranking).toBeGreaterThan(0);
  });
});
