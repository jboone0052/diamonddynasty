import { Pressable, Text, View } from "react-native";
import { useGameSessionStore } from "../src/stores/gameSessionStore";

export default function FinancesScreen() {
  const { game, adjustTicketPrice } = useGameSessionStore();
  if (!game) return <View style={{ padding: 16 }}><Text>No active save.</Text></View>;

  const teamId = game.world.userTeamId;
  const finances = game.finances[teamId];

  return (
    <View style={{ padding: 16, gap: 8 }}>
      <Text style={{ fontSize: 22, fontWeight: "700" }}>Finances</Text>
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
    </View>
  );
}
