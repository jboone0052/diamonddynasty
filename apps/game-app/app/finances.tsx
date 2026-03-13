import { Text, View } from "react-native";
import { useGameSessionStore } from "../src/stores/gameSessionStore";

export default function FinancesScreen() {
  const { game } = useGameSessionStore();
  if (!game) return <View style={{ padding: 16 }}><Text>No active save.</Text></View>;

  const teamId = game.world.userTeamId;
  const finances = game.finances[teamId];

  return (
    <View style={{ padding: 16, gap: 8 }}>
      <Text style={{ fontSize: 22, fontWeight: "700" }}>Finances</Text>
      <Text>Cash: ${finances.currentCash.toLocaleString()}</Text>
      <Text>Debt: ${finances.currentDebt.toLocaleString()}</Text>
      <Text>Monthly Payroll: ${finances.payrollMonthly.toLocaleString()}</Text>
      <Text>Monthly Sponsor Revenue: ${finances.sponsorRevenueMonthly.toLocaleString()}</Text>
      <Text>Ticket Price: ${finances.ticketPrice}</Text>
    </View>
  );
}
