import { ScrollView, Text, View } from "react-native";
import { useGameSessionStore } from "../src/stores/gameSessionStore";

export default function ScheduleScreen() {
  const { game } = useGameSessionStore();
  if (!game) return <View style={{ padding: 16 }}><Text>No active save.</Text></View>;

  const teamId = game.world.userTeamId;
  const games = Object.values(game.schedule).filter(
    (g) => g.homeTeamId === teamId || g.awayTeamId === teamId
  );

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 8 }}>
      {games.map((g) => (
        <View key={g.id} style={{ borderWidth: 1, borderRadius: 8, padding: 12 }}>
          <Text style={{ fontWeight: "700" }}>{g.date}</Text>
          <Text>{game.teams[g.awayTeamId].nickname} @ {game.teams[g.homeTeamId].nickname}</Text>
          <Text>Status: {g.status}</Text>
          {g.result ? <Text>Final: {g.result.awayScore}-{g.result.homeScore}</Text> : null}
        </View>
      ))}
    </ScrollView>
  );
}
