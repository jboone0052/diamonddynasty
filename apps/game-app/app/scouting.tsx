import { Pressable, ScrollView, Text, View } from "react-native";
import { getScoutingSnapshot } from "@baseball-sim/game-core";
import { useGameSessionStore } from "../src/stores/gameSessionStore";

function formatSalary(amount: number) {
  return `$${Math.round(amount / 1000)}k`;
}

function ProspectCard({
  title,
  player,
  isScouted,
  signingSalary,
  report,
  onScout,
  onSign,
}: {
  title?: string;
  player: ReturnType<typeof getScoutingSnapshot>["availableProspects"][number]["player"];
  isScouted: boolean;
  signingSalary: number;
  report?: ReturnType<typeof getScoutingSnapshot>["availableProspects"][number]["report"];
  onScout: () => void;
  onSign: () => void;
}) {
  return (
    <View style={{ borderWidth: 1, borderRadius: 12, padding: 12, gap: 8, borderColor: isScouted ? "#93c5fd" : "#d1d5db", backgroundColor: "white" }}>
      {title ? <Text style={{ fontSize: 12, fontWeight: "700", color: "#475569" }}>{title}</Text> : null}
      <Text style={{ fontSize: 18, fontWeight: "700", color: "#0f172a" }}>{player.fullName}</Text>
      <Text style={{ color: "#334155" }}>{player.primaryPosition} | Age {player.age} | {player.bats}/{player.throws}</Text>
      {isScouted && report ? (
        <>
          <Text style={{ color: "#0f172a" }}>Estimated OVR {report.scoutedOverallEstimate} | Estimated POT {report.scoutedPotentialEstimate}</Text>
          <Text style={{ color: "#475569" }}>Confidence {report.confidence}%</Text>
          {report.notes.map((note) => (
            <Text key={`${player.id}-${note}`} style={{ color: "#334155" }}>- {note}</Text>
          ))}
          <Pressable onPress={onSign} style={{ padding: 10, borderWidth: 1, borderRadius: 8, alignSelf: "flex-start", borderColor: "#1d4ed8" }}>
            <Text style={{ color: "#1d4ed8", fontWeight: "600" }}>Sign Prospect ({formatSalary(signingSalary)})</Text>
          </Pressable>
        </>
      ) : (
        <>
          <Text style={{ color: "#475569" }}>Unsigned amateur target. Ratings are hidden until your scouts file a report.</Text>
          <Pressable onPress={onScout} style={{ padding: 10, borderWidth: 1, borderRadius: 8, alignSelf: "flex-start" }}>
            <Text style={{ fontWeight: "600" }}>Scout Player</Text>
          </Pressable>
        </>
      )}
    </View>
  );
}

export default function ScoutingScreen() {
  const { game, error, loading, scoutProspect, signFreeAgent } = useGameSessionStore();
  if (!game) return <View style={{ padding: 16 }}><Text>No active save.</Text></View>;

  const snapshot = getScoutingSnapshot(game);

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12, backgroundColor: "#f8fafc" }}>
      <View style={{ gap: 6 }}>
        <Text style={{ fontSize: 24, fontWeight: "700", color: "#0f172a" }}>Scouting Market</Text>
        <Text style={{ color: "#334155" }}>
          Your scouts can uncover young free agents before they appear in the normal market. Pitchers are surfaced first so the onboarding flow can send the player here immediately.
        </Text>
        <Text style={{ color: "#475569" }}>Scouting accuracy {snapshot.department.scoutingAccuracy} | Prospect reports filed {snapshot.reports.length}</Text>
        {error ? <Text style={{ color: "#b91c1c" }}>{error}</Text> : null}
      </View>

      <Text style={{ fontSize: 20, fontWeight: "700", color: "#0f172a" }}>Recommended Pitchers</Text>
      {snapshot.recommendedPitchers.length === 0 ? <Text>No unsigned pitchers in the scouting market right now.</Text> : null}
      {snapshot.recommendedPitchers.map((item, index) => (
        <ProspectCard
          key={`pitcher-${item.player.id}`}
          title={`Pitching Target ${index + 1}`}
          player={item.player}
          isScouted={item.isScouted}
          signingSalary={item.signingSalary}
          report={item.report}
          onScout={() => scoutProspect(item.player.id)}
          onSign={() => signFreeAgent(item.player.id)}
        />
      ))}

      <Text style={{ fontSize: 20, fontWeight: "700", color: "#0f172a" }}>Prospect Board</Text>
      {snapshot.availableProspects.length === 0 ? <Text>No scoutable prospects available.</Text> : null}
      {snapshot.availableProspects.map((item) => (
        <ProspectCard
          key={item.player.id}
          player={item.player}
          isScouted={item.isScouted}
          signingSalary={item.signingSalary}
          report={item.report}
          onScout={() => scoutProspect(item.player.id)}
          onSign={() => signFreeAgent(item.player.id)}
        />
      ))}

      {loading ? <Text style={{ color: "#475569" }}>Updating scouting reports...</Text> : null}
    </ScrollView>
  );
}
