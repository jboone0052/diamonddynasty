import { ScrollView, Text, View } from "react-native";
import { getRosterSnapshot } from "@baseball-sim/game-core";
import { useGameSessionStore } from "../src/stores/gameSessionStore";

export default function RosterScreen() {
  const { game } = useGameSessionStore();
  if (!game) return <View style={{ padding: 16 }}><Text>No active save.</Text></View>;

  const snapshot = getRosterSnapshot(game);

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 8 }}>
      {snapshot.roster.map((player) => (
        <View key={player.id} style={{ borderWidth: 1, borderRadius: 8, padding: 12 }}>
          <Text style={{ fontWeight: "700" }}>{player.fullName}</Text>
          <Text>{player.primaryPosition} | Overall (OVR) {player.overall} | POT {player.potential}</Text>
          <Text>Status: {player.status} | Morale {player.morale} | Fatigue {player.fatigue}</Text>
          <Text>Season: {player.seasonStats.games} G | {player.seasonStats.hits} H | {player.seasonStats.homeRuns} HR</Text>
        </View>
      ))}
    </ScrollView>
  );
}
