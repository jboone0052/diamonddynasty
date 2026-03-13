import { Text, View } from "react-native";
import { useGameSessionStore } from "../src/stores/gameSessionStore";

export default function SummaryScreen() {
  const { game } = useGameSessionStore();
  if (!game || !game.seasonSummary) return <View style={{ padding: 16 }}><Text>No season summary yet.</Text></View>;

  const summary = game.seasonSummary;

  return (
    <View style={{ padding: 16, gap: 8 }}>
      <Text style={{ fontSize: 22, fontWeight: "700" }}>Season Summary</Text>
      <Text>{summary.message}</Text>
      <Text>Champion: {game.teams[summary.championTeamId].name}</Text>
      <Text>Promotion: {summary.promotion.promoted ? "Achieved" : "Missed"}</Text>
      <Text>{summary.promotion.summary}</Text>
      <Text>Final rank: {summary.promotion.finalRank}</Text>
    </View>
  );
}
