import { Text, View } from "react-native";
import { getPromotionStatus } from "@baseball-sim/game-core";
import { useGameSessionStore } from "../src/stores/gameSessionStore";

export default function PromotionScreen() {
  const { game } = useGameSessionStore();
  if (!game) return <View style={{ padding: 16 }}><Text>No active save.</Text></View>;

  const status = getPromotionStatus(game);

  return (
    <View style={{ padding: 16, gap: 8 }}>
      <Text style={{ fontSize: 22, fontWeight: "700" }}>Promotion Tracker</Text>
      <Text>Current Rank: {status.currentRank}</Text>
      <Text>Top-2 Finish: {status.rankRequirementMet ? "Met" : "Not yet"}</Text>
      <Text>Stadium Capacity: {status.stadiumRequirementMet ? "Met" : "Short"}</Text>
      <Text>Attendance Threshold: {status.attendanceRequirementMet ? "Met" : "Short"}</Text>
      <Text>Cash Reserve: {status.cashRequirementMet ? "Met" : "Short"}</Text>
      {status.seasonSummary ? <Text style={{ fontWeight: "700" }}>{status.seasonSummary.promotion.summary}</Text> : null}
    </View>
  );
}
