import { ScrollView, Text, View } from "react-native";
import { getScheduleSnapshot } from "@baseball-sim/game-core";
import { useGameSessionStore } from "../src/stores/gameSessionStore";

export default function ScheduleScreen() {
  const { game } = useGameSessionStore();
  if (!game) return <View style={{ padding: 16 }}><Text>No active save.</Text></View>;

  const games = getScheduleSnapshot(game);

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 8 }}>
      {games.map((gameItem) => (
        <View key={gameItem.id} style={{ borderWidth: 1, borderRadius: 8, padding: 12 }}>
          <Text style={{ fontWeight: "700" }}>Week {gameItem.week} | {gameItem.date}</Text>
          <Text>{game.teams[gameItem.awayTeamId].nickname} @ {game.teams[gameItem.homeTeamId].nickname}</Text>
          <Text>Status: {gameItem.status}</Text>
          {gameItem.result ? (
            <>
              <Text>Final: {gameItem.result.awayScore}-{gameItem.result.homeScore}</Text>
              <Text>Attendance: {gameItem.result.attendance.toLocaleString()}</Text>
            </>
          ) : null}
        </View>
      ))}
    </ScrollView>
  );
}
