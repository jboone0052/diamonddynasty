import { describe, expect, it } from "vitest";
import { acknowledgeFtueStep, advanceWeek, completeIntro, createNewGame, getFtueSnapshot, getScoutingSnapshot, scoutProspect, signFreeAgent } from "../src";

describe("ftue flow", () => {
  it("starts a new save in the inheritance briefing with a highlighted pitcher target", () => {
    const game = createNewGame("ftue-start-seed");
    const ftue = getFtueSnapshot(game);

    expect(ftue.isActive).toBe(true);
    expect(ftue.currentStep).toBe("inheritanceBriefing");
    expect(ftue.highlightedProspect).toBeUndefined();
    expect(game.story.ftue.highlightedProspectId).toBeDefined();
  });

  it("progresses through the guided first-session steps", () => {
    const initial = createNewGame("ftue-flow-seed");
    const userTeamId = initial.world.userTeamId;

    const afterIntro = completeIntro(initial, { ownerName: "Avery Cole", teamNickname: "Captains" });
    expect(getFtueSnapshot(afterIntro).currentStep).toBe("scoutPitcher");
    expect(afterIntro.world.ownerName).toBe("Avery Cole");
    expect(afterIntro.teams[userTeamId].nickname).toBe("Captains");

    const recommendedPitcherId = getScoutingSnapshot(afterIntro).recommendedPitchers[0]?.player.id;
    expect(recommendedPitcherId).toBeDefined();

    const afterScout = scoutProspect(afterIntro, userTeamId, recommendedPitcherId!);
    expect(getFtueSnapshot(afterScout).currentStep).toBe("signPitcher");

    const afterSign = signFreeAgent(afterScout, userTeamId, recommendedPitcherId!);
    const afterSignFtue = getFtueSnapshot(afterSign);
    expect(afterSignFtue.currentStep).toBe("reviewPromotion");
    expect(afterSignFtue.highlightedProspect).toBeUndefined();

    const afterPromotion = acknowledgeFtueStep(afterSign, "reviewPromotion");
    expect(getFtueSnapshot(afterPromotion).currentStep).toBe("reviewLineup");

    const afterLineup = acknowledgeFtueStep(afterPromotion, "reviewLineup");
    expect(getFtueSnapshot(afterLineup).currentStep).toBe("reviewFinances");

    const afterFinances = acknowledgeFtueStep(afterLineup, "reviewFinances");
    expect(getFtueSnapshot(afterFinances).currentStep).toBe("advanceWeek");

    const afterWeek = advanceWeek(afterFinances);
    const afterWeekFtue = getFtueSnapshot(afterWeek);
    expect(afterWeekFtue.isActive).toBe(true);
    expect(afterWeekFtue.currentStep).toBe("reviewResults");

    const reviewedResults = acknowledgeFtueStep(afterWeek, "reviewResults");
    const completedFtue = getFtueSnapshot(reviewedResults);
    expect(completedFtue.isActive).toBe(false);
    expect(completedFtue.currentStep).toBe("completed");
  });

  it("guarantees a user-team win in the first tutorial week", () => {
    const initial = createNewGame("ftue-opening-win-seed");
    const userTeamId = initial.world.userTeamId;
    const afterIntro = completeIntro(initial, { ownerName: "Mara Quinn", teamNickname: "Captains" });
    const recommendedPitcherId = getScoutingSnapshot(afterIntro).recommendedPitchers[0]?.player.id;
    const afterScout = scoutProspect(afterIntro, userTeamId, recommendedPitcherId!);
    const afterSign = signFreeAgent(afterScout, userTeamId, recommendedPitcherId!);
    const afterPromotion = acknowledgeFtueStep(afterSign, "reviewPromotion");
    const afterLineup = acknowledgeFtueStep(afterPromotion, "reviewLineup");
    const afterFinances = acknowledgeFtueStep(afterLineup, "reviewFinances");

    const afterWeek = advanceWeek(afterFinances);
    const userGame = Object.values(afterWeek.schedule).find((game) => game.week === 1 && game.status === "completed" && (game.homeTeamId === userTeamId || game.awayTeamId === userTeamId));

    expect(userGame?.result?.winningTeamId).toBe(userTeamId);
    expect(userGame?.result?.notableEvents).toContain("The club opened the season with a statement win.");
  });
});
