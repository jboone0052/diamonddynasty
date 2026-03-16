import type { ReactNode } from "react";
import { Redirect, Link, useRouter } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { introStory } from "@baseball-sim/content";
import { useGameSessionStore } from "../src/stores/gameSessionStore";

function DetailCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={{ borderWidth: 1, borderRadius: 12, padding: 16, gap: 8, borderColor: "#cbd5e1", backgroundColor: "white" }}>
      <Text style={{ fontSize: 16, fontWeight: "700", color: "#0f172a" }}>{title}</Text>
      {children}
    </View>
  );
}

export default function IntroScreen() {
  const router = useRouter();
  const { game, loading, error, completeIntro } = useGameSessionStore();

  if (!game) {
    return <Redirect href="/" />;
  }

  if (game.story.introCompleted) {
    return <Redirect href="/" />;
  }

  const league = game.leagues[game.teams[game.world.userTeamId].leagueId];
  const objective = game.story.objectives[game.story.activeObjectiveIds[0]];
  const stadium = game.stadiums[game.teams[game.world.userTeamId].stadiumId];

  const handleContinue = async () => {
    await completeIntro();
    router.replace("/");
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 16, backgroundColor: "#f8fafc" }}>
      <View style={{ gap: 6 }}>
        <Text style={{ fontSize: 30, fontWeight: "800", color: "#0f172a" }}>Club Inheritance</Text>
        <Text style={{ fontSize: 16, color: "#475569" }}>The season starts now. This is the handoff before you take control.</Text>
      </View>

      <DetailCard title={introStory.title}>
        <Text style={{ color: "#1e293b", lineHeight: 22 }}>{introStory.body}</Text>
      </DetailCard>

      <DetailCard title="Season Objective">
        <Text style={{ color: "#1e293b", fontWeight: "600" }}>{objective.title}</Text>
        <Text style={{ color: "#475569", lineHeight: 21 }}>{objective.description}</Text>
      </DetailCard>

      <DetailCard title="Board Requirements">
        <Text style={{ color: "#1e293b" }}>Finish in the top {league.promotionSpots}.</Text>
        <Text style={{ color: "#1e293b" }}>Average attendance must reach {league.minAverageAttendanceForPromotion.toLocaleString()}.</Text>
        <Text style={{ color: "#1e293b" }}>Cash reserve must stay above ${league.minCashReserveForPromotion.toLocaleString()}.</Text>
        <Text style={{ color: "#1e293b" }}>{stadium.name} must reach {league.minStadiumCapacityForPromotion.toLocaleString()} seats.</Text>
      </DetailCard>

      <DetailCard title="First Week Checklist">
        <Text style={{ color: "#1e293b" }}>1. Review the inherited roster.</Text>
        <Text style={{ color: "#1e293b" }}>2. Set the batting order and rotation.</Text>
        <Text style={{ color: "#1e293b" }}>3. Check ticket prices before the home opener.</Text>
      </DetailCard>

      <View style={{ gap: 10 }}>
        <Pressable onPress={handleContinue} style={{ padding: 14, borderRadius: 10, backgroundColor: "#1f2937" }}>
          <Text style={{ color: "white", fontWeight: "700", textAlign: "center" }}>{loading ? "Entering Front Office..." : "Take Control of the Club"}</Text>
        </Pressable>
        <Link href="/inbox" asChild>
          <Pressable style={{ padding: 14, borderRadius: 10, borderWidth: 1, borderColor: "#cbd5e1", backgroundColor: "white" }}>
            <Text style={{ color: "#0f172a", fontWeight: "600", textAlign: "center" }}>Review Opening Mail First</Text>
          </Pressable>
        </Link>
      </View>

      {error ? <Text style={{ color: "#b91c1c" }}>{error}</Text> : null}
    </ScrollView>
  );
}
