import { ScrollView, Text, View } from "react-native";
import { useGameSessionStore } from "../src/stores/gameSessionStore";

export default function StandingsScreen() {
  const { game } = useGameSessionStore();
  if (!game) return <View style={{ padding: 16 }}><Text>No active save.</Text></View>;

  const team = game.teams[game.world.userTeamId];
  const standings = game.standings[team.leagueId];

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 8 }}>
      {standings.rows.map((row) => (
        <View key={row.teamId} style={{ borderWidth: 1, borderRadius: 8, padding: 12 }}>
          <Text style={{ fontWeight: "700" }}>{game.teams[row.teamId].name}</Text>
          <Text>{row.wins}-{row.losses} · Win% {row.winPct.toFixed(3)} · Streak {row.streak}</Text>
        </View>
      ))}
    </ScrollView>
  );
}
