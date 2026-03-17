import { Redirect, useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { getFtueSnapshot, getPromotionStatus } from "@baseball-sim/game-core";
import { useGameSessionStore } from "../src/stores/gameSessionStore";
import { getFtueHref, getFtueRedirectScreen } from "../src/ftue";

export default function PromotionScreen() {
  const router = useRouter();
  const { game, acknowledgeFtueStep, loading } = useGameSessionStore();
  if (!game) return <View style={{ padding: 16 }}><Text>No active save.</Text></View>;
  const redirectScreen = getFtueRedirectScreen(game, "promotion");
  if (redirectScreen) {
    return <Redirect href={getFtueHref(redirectScreen)} />;
  }

  const status = getPromotionStatus(game);
  const ftue = getFtueSnapshot(game);

  const handleContinueFtue = async () => {
    await acknowledgeFtueStep("reviewPromotion");
    router.replace(getFtueHref("lineup"));
  };

  return (
    <View style={{ padding: 16, gap: 8 }}>
      <Text style={{ fontSize: 22, fontWeight: "700" }}>Promotion Tracker</Text>
      {ftue.isActive && ftue.currentStep === "reviewPromotion" ? (
        <View style={{ borderWidth: 1, borderRadius: 10, padding: 12, gap: 8, borderColor: "#93c5fd", backgroundColor: "#eff6ff" }}>
          <Text style={{ fontWeight: "700", color: "#1d4ed8" }}>{ftue.title}</Text>
          <Text style={{ color: "#334155" }}>{ftue.description}</Text>
          <Pressable onPress={handleContinueFtue} style={{ alignSelf: "flex-start", paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, backgroundColor: "#1d4ed8" }}>
            <Text style={{ color: "white", fontWeight: "700" }}>{loading ? "Updating..." : "Continue to Lineup"}</Text>
          </Pressable>
        </View>
      ) : null}
      <Text>Current Rank: {status.currentRank ?? "--"}</Text>
      <Text>Top-2 Finish: {!status.seasonStarted ? "Season not started" : status.rankRequirementMet ? "Met" : "Not yet"}</Text>
      <Text>Stadium Capacity: {status.stadiumRequirementMet ? "Met" : "Short"}</Text>
      <Text>Attendance Threshold: {status.attendanceRequirementMet ? "Met" : "Short"}</Text>
      <Text>Cash Reserve: {status.cashRequirementMet ? "Met" : "Short"}</Text>
      {status.seasonSummary ? <Text style={{ fontWeight: "700" }}>{status.seasonSummary.promotion.summary}</Text> : null}
    </View>
  );
}
