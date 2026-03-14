import { Pressable, ScrollView, Text, View } from "react-native";
import { useState } from "react";
import { getScheduleSnapshot } from "@baseball-sim/game-core";
import { useGameSessionStore } from "../src/stores/gameSessionStore";

export default function ScheduleScreen() {
  const { game } = useGameSessionStore();
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);

  if (!game) return <View style={{ padding: 16 }}><Text>No active save.</Text></View>;

  const games = getScheduleSnapshot(game);

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 8 }}>
      {games.map((gameItem) => {
        const isSelected = selectedGameId === gameItem.id;
        const playByPlay = gameItem.result?.playByPlay ?? [];
        const hasPlayByPlay = playByPlay.length > 0;

        return (
          <Pressable
            key={gameItem.id}
            onPress={() => setSelectedGameId((current) => current === gameItem.id ? null : gameItem.id)}
            style={{
              borderWidth: 1,
              borderRadius: 8,
              padding: 12,
              borderColor: isSelected ? "#1d4ed8" : "#d1d5db",
              backgroundColor: isSelected ? "#eff6ff" : "white",
            }}
          >
            <Text style={{ fontWeight: "700" }}>Week {gameItem.week} | {gameItem.date}</Text>
            <Text>{game.teams[gameItem.awayTeamId].nickname} @ {game.teams[gameItem.homeTeamId].nickname}</Text>
            <Text>Status: {gameItem.status}</Text>
            {gameItem.result ? (
              <>
                <Text>Final: {gameItem.result.awayScore}-{gameItem.result.homeScore}</Text>
                <Text>Attendance: {gameItem.result.attendance.toLocaleString()}</Text>
                <Text style={{ marginTop: 6, fontWeight: "600" }}>
                  {isSelected ? "Hide play-by-play" : "Tap to view play-by-play"}
                </Text>
                {isSelected ? (
                  <View style={{ marginTop: 8, gap: 4 }}>
                    {hasPlayByPlay ? playByPlay.map((entry, index) => (
                      <Text key={`${gameItem.id}-pbp-${index}`} style={{ fontSize: 12 }}>
                        {index + 1}. {entry}
                      </Text>
                    )) : <Text style={{ fontSize: 12 }}>No play-by-play available for this game yet.</Text>}
                  </View>
                ) : null}
              </>
            ) : null}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
