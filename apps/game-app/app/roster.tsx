import { Pressable, ScrollView, Text, View } from "react-native";
import { getPlayerHealthSnapshot, getRosterSnapshot, getVisibleFreeAgentMarket } from "@baseball-sim/game-core";
import { useGameSessionStore } from "../src/stores/gameSessionStore";

function formatPayrollImpact(monthlyDelta: number) {
  const sign = monthlyDelta >= 0 ? "+" : "-";
  return `${sign}$${Math.abs(monthlyDelta).toLocaleString()} / month payroll`;
}

function getHealthColors(label: string) {
  switch (label) {
    case "Injured":
      return { backgroundColor: "#fee2e2", color: "#991b1b" };
    case "High":
      return { backgroundColor: "#ffedd5", color: "#9a3412" };
    case "Elevated":
      return { backgroundColor: "#fef3c7", color: "#92400e" };
    case "Watch":
      return { backgroundColor: "#dbeafe", color: "#1d4ed8" };
    default:
      return { backgroundColor: "#dcfce7", color: "#166534" };
  }
}

function renderSeasonLine(player: ReturnType<typeof getRosterSnapshot>["roster"][number]) {
  if (player.primaryPosition === "SP" || player.primaryPosition === "RP") {
    return `${player.seasonStats.wins}-${player.seasonStats.losses} W-L | ${player.seasonStats.inningsPitched.toFixed(1)} IP | ${player.seasonStats.earnedRuns} ER | ${player.seasonStats.strikeoutsPitched} SO | ${player.seasonStats.walksAllowed} BB`;
  }

  return `${player.seasonStats.games} G | ${player.seasonStats.hits} H | ${player.seasonStats.homeRuns} HR | AVG ${player.seasonStats.battingAverage.toFixed(3)}`;
}

export default function RosterScreen() {
  const { game, error, releasePlayer, signFreeAgent } = useGameSessionStore();
  if (!game) return <View style={{ padding: 16 }}><Text>No active save.</Text></View>;

  const snapshot = getRosterSnapshot(game);
  const freeAgents = getVisibleFreeAgentMarket(game);

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 8 }}>
      <Text style={{ fontSize: 22, fontWeight: "700" }}>Current Roster</Text>
      {error ? <Text style={{ color: "#b91c1c" }}>{error}</Text> : null}
      {snapshot.roster.map((player) => {
        const health = getPlayerHealthSnapshot(game, player.id);
        const tone = getHealthColors(health.riskLabel);
        const contract = player.contractId ? game.contracts[player.contractId] : undefined;

        return (
          <View key={player.id} style={{ borderWidth: 1, borderRadius: 8, padding: 12, gap: 6, borderColor: health.activeInjury ? "#fca5a5" : "#d1d5db" }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 8, alignItems: "flex-start" }}>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={{ fontWeight: "700" }}>{player.fullName}</Text>
                <Text>{player.primaryPosition} | Overall (OVR) {player.overall} | POT {player.potential}</Text>
              </View>
              <View style={{ borderRadius: 999, paddingVertical: 6, paddingHorizontal: 10, backgroundColor: tone.backgroundColor }}>
                <Text style={{ color: tone.color, fontWeight: "700" }}>{health.riskLabel}</Text>
              </View>
            </View>
            <Text>Status: {player.status} | Morale {player.morale} | Fatigue {player.fatigue}</Text>
            <Text>{renderSeasonLine(player)}</Text>
            {health.activeInjury ? (
              <>
                <Text style={{ color: "#991b1b", fontWeight: "600" }}>{health.recoverySummary}</Text>
                <Text style={{ color: "#7f1d1d" }}>{health.recoveryOutlook}</Text>
              </>
            ) : (
              <>
                <Text>Risk Score {health.riskScore} | Medical Support L{health.medicalSupportLevel}</Text>
                <Text style={{ color: "#475569" }}>{health.factors.join(" | ")}</Text>
              </>
            )}
            <Pressable onPress={() => releasePlayer(player.id)} style={{ padding: 8, borderWidth: 1, borderRadius: 8, alignSelf: "flex-start" }}>
              <Text>
                Release Player ({formatPayrollImpact(-Math.round((contract?.annualSalary ?? 0) / 12))})
              </Text>
            </Pressable>
          </View>
        );
      })}

      <Text style={{ fontSize: 22, fontWeight: "700", marginTop: 8 }}>Available Market</Text>
      <Text style={{ color: "#475569" }}>Established free agents appear here automatically. Young prospects only appear after you scout them from the Scouting screen.</Text>
      {freeAgents.length === 0 ? <Text>No visible free agents currently available.</Text> : null}
      {freeAgents.map((item) => {
        const health = getPlayerHealthSnapshot(game, item.player.id);
        const tone = getHealthColors(health.riskLabel);
        const displayOverall = item.report?.scoutedOverallEstimate ?? item.player.overall;
        const displayPotential = item.report?.scoutedPotentialEstimate ?? item.player.potential;

        return (
          <View key={`fa-${item.player.id}`} style={{ borderWidth: 1, borderRadius: 8, padding: 12, gap: 6 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 8, alignItems: "flex-start" }}>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={{ fontWeight: "700" }}>{item.player.fullName}</Text>
                <Text>{item.player.primaryPosition} | {item.isProspect ? "Scouted estimate" : "Overall (OVR)"} {displayOverall} | POT {displayPotential}</Text>
              </View>
              <View style={{ borderRadius: 999, paddingVertical: 6, paddingHorizontal: 10, backgroundColor: tone.backgroundColor }}>
                <Text style={{ color: tone.color, fontWeight: "700" }}>{health.riskLabel}</Text>
              </View>
            </View>
            <Text>Morale {item.player.morale} | Fatigue {item.player.fatigue}</Text>
            {item.report ? (
              <>
                <Text style={{ color: "#475569" }}>Scouting confidence {item.report.confidence}%</Text>
                <Text style={{ color: "#475569" }}>{item.report.notes.join(" | ")}</Text>
              </>
            ) : (
              <Text style={{ color: "#475569" }}>{health.factors.join(" | ")}</Text>
            )}
            <Pressable onPress={() => signFreeAgent(item.player.id)} style={{ padding: 8, borderWidth: 1, borderRadius: 8, alignSelf: "flex-start" }}>
              <Text>
                Sign Player ({formatPayrollImpact(Math.round(item.signingSalary / 12))})
              </Text>
            </Pressable>
          </View>
        );
      })}
    </ScrollView>
  );
}
