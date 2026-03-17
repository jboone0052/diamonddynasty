import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Redirect, Link, useRouter } from "expo-router";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
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
  const [ownerName, setOwnerName] = useState("");
  const [teamNickname, setTeamNickname] = useState("");

  useEffect(() => {
    if (!game) {
      return;
    }
    setOwnerName(game.world.ownerName);
    setTeamNickname(game.teams[game.world.userTeamId].nickname);
  }, [game]);

  if (!game) {
    return <Redirect href="/" />;
  }

  if (game.story.introCompleted) {
    return <Redirect href="/" />;
  }

  const league = game.leagues[game.teams[game.world.userTeamId].leagueId];
  const team = game.teams[game.world.userTeamId];
  const objective = game.story.objectives[game.story.activeObjectiveIds[0]];
  const stadium = game.stadiums[team.stadiumId];

  const ownerNameIsValid = ownerName.trim().length >= 2 && ownerName.trim().length <= 40;
  const nicknameTrimmed = teamNickname.trim();
  const nicknameIsValid = nicknameTrimmed.length === 0 || (nicknameTrimmed.length >= 2 && nicknameTrimmed.length <= 24);
  const nextNickname = nicknameTrimmed.length >= 2 ? nicknameTrimmed : team.nickname;

  const handleContinue = async () => {
    if (!ownerNameIsValid || !nicknameIsValid) {
      return;
    }
    await completeIntro(ownerName, teamNickname);
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

      <DetailCard title="Make It Your Club">
        <Text style={{ color: "#475569" }}>Set your owner name and optionally rename the club nickname before the first week begins.</Text>
        <View style={{ gap: 6 }}>
          <Text style={{ color: "#0f172a", fontWeight: "600" }}>Owner Name</Text>
          <TextInput
            value={ownerName}
            onChangeText={setOwnerName}
            placeholder="Enter owner name"
            autoCapitalize="words"
            maxLength={40}
            style={{ borderWidth: 1, borderColor: ownerNameIsValid || ownerName.length === 0 ? "#cbd5e1" : "#fca5a5", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: "white", color: "#0f172a" }}
          />
          <Text style={{ color: ownerNameIsValid || ownerName.length === 0 ? "#64748b" : "#991b1b" }}>2 to 40 characters.</Text>
        </View>
        <View style={{ gap: 6 }}>
          <Text style={{ color: "#0f172a", fontWeight: "600" }}>Team Nickname (Optional)</Text>
          <TextInput
            value={teamNickname}
            onChangeText={setTeamNickname}
            placeholder={team.nickname}
            autoCapitalize="words"
            maxLength={24}
            style={{ borderWidth: 1, borderColor: nicknameIsValid ? "#cbd5e1" : "#fca5a5", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: "white", color: "#0f172a" }}
          />
          <Text style={{ color: nicknameIsValid ? "#64748b" : "#991b1b" }}>Leave it alone to keep the inherited nickname. 2 to 24 characters if changed.</Text>
        </View>
        <View style={{ borderWidth: 1, borderRadius: 10, padding: 12, gap: 4, borderColor: "#dbeafe", backgroundColor: "#f8fbff" }}>
          <Text style={{ fontWeight: "700", color: "#0f172a" }}>Club Reveal</Text>
          <Text style={{ color: "#334155" }}>OWNER: {ownerName.trim() || "Unassigned"}</Text>
          <Text style={{ color: "#334155" }}>TEAM: {team.city} {nextNickname}</Text>
          <Text style={{ color: "#334155" }}>LEAGUE: {league.name}</Text>
          <Text style={{ color: "#334155" }}>STADIUM: {stadium.name}</Text>
        </View>
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
        <Pressable
          onPress={ownerNameIsValid && nicknameIsValid ? handleContinue : undefined}
          style={{ padding: 14, borderRadius: 10, backgroundColor: ownerNameIsValid && nicknameIsValid ? "#1f2937" : "#94a3b8" }}
        >
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
