import { ScrollView, Text, View } from "react-native";
import { useGameSessionStore } from "../src/stores/gameSessionStore";

export default function RosterScreen() {
  const { game } = useGameSessionStore();
  if (!game) return <View style={{ padding: 16 }}><Text>No active save.</Text></View>;

  const team = game.teams[game.world.userTeamId];
  const players = team.rosterPlayerIds.map((id) => game.players[id]);

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 8 }}>
      {players.map((player) => (
        <View key={player.id} style={{ borderWidth: 1, borderRadius: 8, padding: 12 }}>
          <Text style={{ fontWeight: "700" }}>{player.fullName}</Text>
          <Text>{player.primaryPosition} · OVR {player.overall} · POT {player.potential}</Text>
          <Text>Morale {player.morale} · Fatigue {player.fatigue}</Text>
        </View>
      ))}
    </ScrollView>
  );
}
