import { Pressable, ScrollView, Text, View } from "react-native";
import { useGameSessionStore } from "../src/stores/gameSessionStore";

function formatBattingAverage(hits: number, atBats: number) {
  if (atBats <= 0) return ".000";
  return `${(hits / atBats).toFixed(3)}`.replace("0.", ".");
}

export default function LineupScreen() {
  const { game, moveLineupPlayer, replaceLineupPlayer, moveRotationPlayer } = useGameSessionStore();
  if (!game) return <View style={{ padding: 16 }}><Text>No active save.</Text></View>;

  const team = game.teams[game.world.userTeamId];

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 22, fontWeight: "700" }}>Batting Order</Text>
      {team.activeLineup.battingOrderPlayerIds.map((playerId, index) => {
        const player = game.players[playerId];
        const benchPlayerIds = team.rosterPlayerIds.filter((id) => {
          if (team.activeLineup.battingOrderPlayerIds.includes(id)) return false;
          const benchPlayer = game.players[id];
          return benchPlayer.primaryPosition === player.primaryPosition;
        });
        return (
          <View key={playerId} style={{ borderWidth: 1, borderRadius: 8, padding: 12, gap: 8 }}>
            <Text style={{ fontWeight: "700" }}>{index + 1}. {player.fullName}</Text>
            <Text>{player.primaryPosition} | Overall (OVR) {player.overall}</Text>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <Pressable onPress={() => moveLineupPlayer(index, index - 1)} style={{ padding: 8, borderWidth: 1, borderRadius: 8 }}>
                <Text>Move Up</Text>
              </Pressable>
              <Pressable onPress={() => moveLineupPlayer(index, index + 1)} style={{ padding: 8, borderWidth: 1, borderRadius: 8 }}>
                <Text>Move Down</Text>
              </Pressable>
            </View>
            {benchPlayerIds.length > 0 ? (
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {benchPlayerIds.map((benchId) => {
                  const benchPlayer = game.players[benchId];
                  const battingAverage = formatBattingAverage(benchPlayer.seasonStats.hits, benchPlayer.seasonStats.atBats);
                  return (
                    <Pressable
                      key={`${playerId}-${benchId}`}
                      onPress={() => replaceLineupPlayer(index, benchId)}
                      style={{ paddingVertical: 6, paddingHorizontal: 10, borderWidth: 1, borderRadius: 12, maxWidth: "100%" }}
                    >
                      <Text style={{ fontWeight: "600" }}>Swap with {benchPlayer.fullName}</Text>
                      <Text>{benchPlayer.primaryPosition} | OVR {benchPlayer.overall}</Text>
                      <Text>
                        Season: {benchPlayer.seasonStats.games} G | AVG {battingAverage} | {benchPlayer.seasonStats.hits} H | {benchPlayer.seasonStats.homeRuns} HR | {benchPlayer.seasonStats.runsBattedIn} RBI
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ) : (
              <Text>No bench players available at {player.primaryPosition}.</Text>
            )}
          </View>
        );
      })}

      <Text style={{ fontSize: 22, fontWeight: "700" }}>Rotation</Text>
      {team.rotation.starterPlayerIds.map((playerId, index) => {
        const player = game.players[playerId];
        return (
          <View key={playerId} style={{ borderWidth: 1, borderRadius: 8, padding: 12, gap: 8 }}>
            <Text style={{ fontWeight: "700" }}>Starter {index + 1}: {player.fullName}</Text>
            <Text>{player.primaryPosition} | Overall (OVR) {player.overall}</Text>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <Pressable onPress={() => moveRotationPlayer(index, index - 1)} style={{ padding: 8, borderWidth: 1, borderRadius: 8 }}>
                <Text>Move Up</Text>
              </Pressable>
              <Pressable onPress={() => moveRotationPlayer(index, index + 1)} style={{ padding: 8, borderWidth: 1, borderRadius: 8 }}>
                <Text>Move Down</Text>
              </Pressable>
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}
