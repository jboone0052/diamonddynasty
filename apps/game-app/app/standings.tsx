import { Redirect } from "expo-router";
import { ScrollView, Text, View } from "react-native";
import { getFtueSnapshot, getStandingsSnapshot } from "@baseball-sim/game-core";
import { useGameSessionStore } from "../src/stores/gameSessionStore";
import { getFtueHref } from "../src/ftue";

export default function StandingsScreen() {
  const { game } = useGameSessionStore();
  if (!game) return <View style={{ padding: 16 }}><Text>No active save.</Text></View>;
  const ftue = getFtueSnapshot(game);
  if (ftue.isActive) {
    return <Redirect href={getFtueHref(ftue.primaryScreen)} />;
  }

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
