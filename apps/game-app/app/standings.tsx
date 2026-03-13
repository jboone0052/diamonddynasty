import { ScrollView, Text, View } from "react-native";
import { getStandingsSnapshot } from "@baseball-sim/game-core";
import { useGameSessionStore } from "../src/stores/gameSessionStore";

export default function StandingsScreen() {
  const { game } = useGameSessionStore();
  if (!game) return <View style={{ padding: 16 }}><Text>No active save.</Text></View>;

  const standings = getStandingsSnapshot(game);

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 8 }}>
      {standings.map((row, index) => (
        <View key={row.teamId} style={{ borderWidth: 1, borderRadius: 8, padding: 12 }}>
          <Text style={{ fontWeight: "700" }}>{index + 1}. {game.teams[row.teamId].name}</Text>
          <Text>{row.wins}-{row.losses} | Win% {row.winPct.toFixed(3)} | RD {row.runDifferential}</Text>
          <Text>Attendance {row.averageAttendance.toLocaleString()} | Streak {row.streak}</Text>
        </View>
      ))}
    </ScrollView>
  );
}
