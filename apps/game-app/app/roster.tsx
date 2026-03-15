import { Pressable, ScrollView, Text, View } from "react-native";
import { getRosterSnapshot } from "@baseball-sim/game-core";
import { useGameSessionStore } from "../src/stores/gameSessionStore";

export default function RosterScreen() {
  const { game, error, releasePlayer, signFreeAgent } = useGameSessionStore();
  if (!game) return <View style={{ padding: 16 }}><Text>No active save.</Text></View>;

  const snapshot = getRosterSnapshot(game);
  const freeAgents = Object.values(game.players)
    .filter((player) => !player.currentTeamId && player.status === "freeAgent")
    .sort((a, b) => b.overall - a.overall)
    .slice(0, 20);

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 8 }}>
      <Text style={{ fontSize: 22, fontWeight: "700" }}>Current Roster</Text>
      {error ? <Text style={{ color: "#b91c1c" }}>{error}</Text> : null}
      {snapshot.roster.map((player) => (
        <View key={player.id} style={{ borderWidth: 1, borderRadius: 8, padding: 12, gap: 6 }}>
          <Text style={{ fontWeight: "700" }}>{player.fullName}</Text>
          <Text>{player.primaryPosition} | Overall (OVR) {player.overall} | POT {player.potential}</Text>
          <Text>Status: {player.status} | Morale {player.morale} | Fatigue {player.fatigue}</Text>
          <Text>Season: {player.seasonStats.games} G | {player.seasonStats.hits} H | {player.seasonStats.homeRuns} HR</Text>
          <Text>AVG: {player.seasonStats.battingAverage.toFixed(3)} | BB: {player.seasonStats.walks} | SO: {player.seasonStats.strikeouts}</Text>
          <Pressable onPress={() => releasePlayer(player.id)} style={{ padding: 8, borderWidth: 1, borderRadius: 8, alignSelf: "flex-start" }}>
            <Text>Release Player</Text>
          </Pressable>
        </View>
      ))}

      <Text style={{ fontSize: 22, fontWeight: "700", marginTop: 8 }}>Free Agents</Text>
      {freeAgents.length === 0 ? <Text>No free agents currently available.</Text> : null}
      {freeAgents.map((player) => (
        <View key={`fa-${player.id}`} style={{ borderWidth: 1, borderRadius: 8, padding: 12, gap: 6 }}>
          <Text style={{ fontWeight: "700" }}>{player.fullName}</Text>
          <Text>{player.primaryPosition} | Overall (OVR) {player.overall} | POT {player.potential}</Text>
          <Text>Morale {player.morale} | Fatigue {player.fatigue}</Text>
          <Pressable onPress={() => signFreeAgent(player.id)} style={{ padding: 8, borderWidth: 1, borderRadius: 8, alignSelf: "flex-start" }}>
            <Text>Sign Player</Text>
          </Pressable>
        </View>
      ))}
    </ScrollView>
  );
}
