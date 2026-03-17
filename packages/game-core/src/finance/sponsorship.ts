import { economyConfig } from "@baseball-sim/config";

export function getStreakSponsorAdjustment(streak: number) {
  if (streak >= 3) {
    return Math.min(0.18, 0.05 + ((streak - 3) * 0.025));
  }
  if (streak <= -3) {
    return -Math.min(0.18, 0.05 + ((Math.abs(streak) - 3) * 0.025));
  }
  return 0;
}

export function getNextSeasonSponsorBase(currentBase: number, previousSeasonWins: number, completedSeasonWins: number) {
  const winDelta = completedSeasonWins - previousSeasonWins;
  const performanceMultiplier = 1 + Math.max(-0.32, Math.min(0.42, winDelta * 0.06));
  const nextBase = Math.round(currentBase * performanceMultiplier);
  return Math.max(
    Math.round(economyConfig.baseSponsorRevenueMonthly * 0.55),
    Math.min(Math.round(economyConfig.baseSponsorRevenueMonthly * 2.75), nextBase),
  );
}
