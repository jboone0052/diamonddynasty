import { economyConfig } from "@baseball-sim/config";
import { Redirect, useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { getFtueSnapshot } from "@baseball-sim/game-core";
import { useGameSessionStore } from "../src/stores/gameSessionStore";
import { getFtueHref, getFtueRedirectScreen } from "../src/ftue";

export default function FinancesScreen() {
  const router = useRouter();
  const { game, error, loading, acknowledgeFtueStep, adjustTicketPrice, expandStadiumCapacity } = useGameSessionStore();
  if (!game) return <View style={{ padding: 16 }}><Text>No active save.</Text></View>;
  const redirectScreen = getFtueRedirectScreen(game, "finances");
  if (redirectScreen) {
    return <Redirect href={getFtueHref(redirectScreen)} />;
  }

  const teamId = game.world.userTeamId;
  const team = game.teams[teamId];
  const finances = game.finances[teamId];
  const facility = game.facilities[teamId];
  const stadium = game.stadiums[team.stadiumId];

  const seatsAdded = economyConfig.stadiumExpansionSeatsPerUpgrade;
  const costGrowth = 1 + (facility.stadiumUpgradeLevel - 1) * economyConfig.stadiumExpansionCostGrowthPerLevel;
  const nextUpgradeCost = Math.round(seatsAdded * economyConfig.stadiumExpansionCostPerSeat * costGrowth);
  const canAffordUpgrade = finances.currentCash >= nextUpgradeCost;
  const ftue = getFtueSnapshot(game);

  const handleContinueFtue = async () => {
    await acknowledgeFtueStep("reviewFinances");
    router.replace(getFtueHref("dashboard"));
  };

  return (
    <View style={{ padding: 16, gap: 8 }}>
      <Text style={{ fontSize: 22, fontWeight: "700" }}>Finances</Text>
      {ftue.isActive && ftue.currentStep === "reviewFinances" ? (
        <View style={{ borderWidth: 1, borderRadius: 10, padding: 12, gap: 8, borderColor: "#93c5fd", backgroundColor: "#eff6ff" }}>
          <Text style={{ fontWeight: "700", color: "#1d4ed8" }}>{ftue.title}</Text>
          <Text style={{ color: "#334155" }}>{ftue.description}</Text>
          <Pressable onPress={handleContinueFtue} style={{ alignSelf: "flex-start", paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, backgroundColor: "#1d4ed8" }}>
            <Text style={{ color: "white", fontWeight: "700" }}>{loading ? "Updating..." : "Continue to First Week"}</Text>
          </Pressable>
        </View>
      ) : null}
      {error ? <Text style={{ color: "#b91c1c" }}>{error}</Text> : null}
      <Text>Cash: ${finances.currentCash.toLocaleString()}</Text>
      <Text>Debt: ${finances.currentDebt.toLocaleString()}</Text>
      <Text>Monthly Payroll: ${finances.payrollMonthly.toLocaleString()}</Text>
      <Text>Staff / Upkeep / Scouting / Marketing: ${finances.staffCostsMonthly.toLocaleString()} / ${finances.facilityUpkeepMonthly.toLocaleString()} / ${finances.scoutingBudgetMonthly.toLocaleString()} / ${finances.marketingBudgetMonthly.toLocaleString()}</Text>
      <Text>Sponsor Revenue: ${finances.sponsorRevenueMonthly.toLocaleString()}</Text>
      <Text>Weekly Ticket Revenue: ${finances.lastMonthRevenueBreakdown.ticketSales.toLocaleString()}</Text>
      <Text>Weekly Expenses: ${Object.values(finances.lastMonthExpenseBreakdown).reduce((sum, value) => sum + value, 0).toLocaleString()}</Text>
      <Text>Ticket Price: ${finances.ticketPrice}</Text>
      <View style={{ flexDirection: "row", gap: 8 }}>
        <Pressable onPress={() => adjustTicketPrice(-1)} style={{ padding: 10, borderWidth: 1, borderRadius: 8 }}>
          <Text>Lower</Text>
        </Pressable>
        <Pressable onPress={() => adjustTicketPrice(1)} style={{ padding: 10, borderWidth: 1, borderRadius: 8 }}>
          <Text>Raise</Text>
        </Pressable>
      </View>

      <Text style={{ marginTop: 8, fontWeight: "700" }}>Stadium Expansion</Text>
      <Text>{stadium.name} Capacity: {stadium.capacity.toLocaleString()}</Text>
      <Text>Current Upgrade Level: {facility.stadiumUpgradeLevel}</Text>
      <Text>Next Expansion: +{seatsAdded.toLocaleString()} seats for ${nextUpgradeCost.toLocaleString()}</Text>
      <Text>Upkeep Increase: +${(seatsAdded * economyConfig.stadiumExpansionUpkeepPerSeatMonthly).toLocaleString()} / month</Text>
      <Pressable
        onPress={canAffordUpgrade ? expandStadiumCapacity : undefined}
        style={{
          padding: 10,
          borderRadius: 8,
          borderWidth: 1,
          borderColor: canAffordUpgrade ? "#1f2937" : "#cbd5e1",
          backgroundColor: canAffordUpgrade ? "#1f2937" : "#e2e8f0",
        }}
      >
        <Text style={{ color: canAffordUpgrade ? "white" : "#475569", fontWeight: "600" }}>
          {canAffordUpgrade ? "Expand Stadium" : "Insufficient Cash"}
        </Text>
      </Pressable>
    </View>
  );
}
