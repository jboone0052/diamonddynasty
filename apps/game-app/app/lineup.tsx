import { Pressable, ScrollView, Text, View } from "react-native";
import { getPlayerHealthSnapshot, getTeamManagementHealthSnapshot } from "@baseball-sim/game-core";
import { useGameSessionStore } from "../src/stores/gameSessionStore";

function formatBattingAverage(hits: number, atBats: number) {
  if (atBats <= 0) return ".000";
  return `${(hits / atBats).toFixed(3)}`.replace("0.", ".");
}

function formatPitcherRecord(wins: number, losses: number) {
  return `${wins}-${losses}`;
}

function getHealthColors(label: string) {
  switch (label) {
    case "Injured":
      return { backgroundColor: "#fee2e2", color: "#991b1b", borderColor: "#fca5a5" };
    case "High":
      return { backgroundColor: "#ffedd5", color: "#9a3412", borderColor: "#fdba74" };
    case "Elevated":
      return { backgroundColor: "#fef3c7", color: "#92400e", borderColor: "#fcd34d" };
    case "Watch":
      return { backgroundColor: "#dbeafe", color: "#1d4ed8", borderColor: "#93c5fd" };
    default:
      return { backgroundColor: "#dcfce7", color: "#166534", borderColor: "#86efac" };
  }
}

function WarningCard({ title, items }: { title: string; items: Array<{ playerId: string; summary: string; riskLabel: string }> }) {
  return (
    <View style={{ borderWidth: 1, borderRadius: 12, padding: 14, borderColor: "#fed7aa", backgroundColor: "#fff7ed", gap: 8 }}>
      <Text style={{ fontSize: 18, fontWeight: "700", color: "#9a3412" }}>{title}</Text>
      {items.map((item) => (
        <Text key={`${title}-${item.playerId}`} style={{ color: "#7c2d12" }}>
          - {item.summary}
        </Text>
      ))}
    </View>
  );
}

export default function LineupScreen() {
  const { game, moveLineupPlayer, replaceLineupPlayer, moveRotationPlayer } = useGameSessionStore();
  if (!game) return <View style={{ padding: 16 }}><Text>No active save.</Text></View>;

  const team = game.teams[game.world.userTeamId];
  const healthSnapshot = getTeamManagementHealthSnapshot(game);

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      {healthSnapshot.lineupWarnings.length > 0 ? <WarningCard title="Lineup Warnings" items={healthSnapshot.lineupWarnings} /> : null}
      {healthSnapshot.rotationWarnings.length > 0 ? <WarningCard title="Rotation Warnings" items={healthSnapshot.rotationWarnings} /> : null}

      <Text style={{ fontSize: 22, fontWeight: "700" }}>Batting Order</Text>
      {team.activeLineup.battingOrderPlayerIds.map((playerId, index) => {
        const player = game.players[playerId];
        const health = getPlayerHealthSnapshot(game, playerId);
        const tone = getHealthColors(health.riskLabel);
        const benchPlayerIds = team.rosterPlayerIds.filter((id) => {
          if (team.activeLineup.battingOrderPlayerIds.includes(id)) return false;
          const benchPlayer = game.players[id];
          if (benchPlayer.status === "injured" || benchPlayer.status === "suspended" || benchPlayer.status === "retired") return false;
          return (
            benchPlayer.primaryPosition === player.primaryPosition
            || benchPlayer.secondaryPositions.includes(player.primaryPosition)
          );
        });
        return (
          <View key={playerId} style={{ borderWidth: 1, borderRadius: 8, padding: 12, gap: 8, borderColor: tone.borderColor }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 8, alignItems: "flex-start" }}>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={{ fontWeight: "700" }}>{index + 1}. {player.fullName}</Text>
                <Text>{player.primaryPosition} | Overall (OVR) {player.overall}</Text>
              </View>
              <View style={{ borderRadius: 999, paddingVertical: 6, paddingHorizontal: 10, backgroundColor: tone.backgroundColor }}>
                <Text style={{ color: tone.color, fontWeight: "700" }}>{health.riskLabel}</Text>
              </View>
            </View>
            <Text>Fatigue {player.fatigue} | Morale {player.morale}</Text>
            <Text style={{ color: health.activeInjury ? "#991b1b" : "#475569" }}>
              {health.activeInjury ? health.recoverySummary : health.factors.join(" | ")}
            </Text>
            {health.activeInjury && health.recoveryOutlook ? <Text style={{ color: "#7f1d1d" }}>{health.recoveryOutlook}</Text> : null}
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
                  const benchHealth = getPlayerHealthSnapshot(game, benchId);
                  const battingAverage = formatBattingAverage(benchPlayer.seasonStats.hits, benchPlayer.seasonStats.atBats);
                  const benchTone = getHealthColors(benchHealth.riskLabel);
                  return (
                    <Pressable
                      key={`${playerId}-${benchId}`}
                      onPress={() => replaceLineupPlayer(index, benchId)}
                      style={{ paddingVertical: 6, paddingHorizontal: 10, borderWidth: 1, borderRadius: 12, maxWidth: "100%", borderColor: benchTone.borderColor }}
                    >
                      <Text style={{ fontWeight: "600" }}>Swap with {benchPlayer.fullName}</Text>
                      <Text>{benchPlayer.primaryPosition} | OVR {benchPlayer.overall} | {benchHealth.riskLabel}</Text>
                      <Text>
                        Season: {benchPlayer.seasonStats.games} G | AVG {battingAverage} | {benchPlayer.seasonStats.hits} H | {benchPlayer.seasonStats.homeRuns} HR | {benchPlayer.seasonStats.runsBattedIn} RBI
                      </Text>
                      <Text style={{ color: "#475569" }}>{benchHealth.factors.join(" | ")}</Text>
                    </Pressable>
                  );
                })}
              </View>
            ) : (
              <Text>No healthy bench players available at {player.primaryPosition}.</Text>
            )}
          </View>
        );
      })}

      <Text style={{ fontSize: 22, fontWeight: "700" }}>Rotation</Text>
      {team.rotation.starterPlayerIds.map((playerId, index) => {
        const player = game.players[playerId];
        const health = getPlayerHealthSnapshot(game, playerId);
        const tone = getHealthColors(health.riskLabel);
        return (
          <View key={playerId} style={{ borderWidth: 1, borderRadius: 8, padding: 12, gap: 8, borderColor: tone.borderColor }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 8, alignItems: "flex-start" }}>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={{ fontWeight: "700" }}>Starter {index + 1}: {player.fullName}</Text>
                <Text>{player.primaryPosition} | Overall (OVR) {player.overall}</Text>
              </View>
              <View style={{ borderRadius: 999, paddingVertical: 6, paddingHorizontal: 10, backgroundColor: tone.backgroundColor }}>
                <Text style={{ color: tone.color, fontWeight: "700" }}>{health.riskLabel}</Text>
              </View>
            </View>
            <Text>
              Fatigue {player.fatigue} | Morale {player.morale} | W-L {formatPitcherRecord(player.seasonStats.wins, player.seasonStats.losses)}
            </Text>
            <Text style={{ color: health.activeInjury ? "#991b1b" : "#475569" }}>
              {health.activeInjury ? health.recoverySummary : health.factors.join(" | ")}
            </Text>
            {health.activeInjury && health.recoveryOutlook ? <Text style={{ color: "#7f1d1d" }}>{health.recoveryOutlook}</Text> : null}
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
