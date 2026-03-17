import { Link, Redirect, useRouter } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { getDashboardSnapshot, getLatestCompletedWeek, getTeamManagementHealthSnapshot } from "@baseball-sim/game-core";
import { useGameSessionStore } from "../src/stores/gameSessionStore";

function NavButton({ href, label }: { href: "/results" | "/roster" | "/lineup" | "/standings" | "/schedule" | "/finances" | "/promotion" | "/promotion-plan" | "/inbox" | "/summary" | "/saves"; label: string }) {
  return (
    <Link href={href} asChild>
      <Pressable style={{ padding: 12, borderWidth: 1, borderRadius: 8 }}>
        <Text>{label}</Text>
      </Pressable>
    </Link>
  );
}

function DashboardCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ borderWidth: 1, borderRadius: 8, padding: 12 }}>
      <Text style={{ fontSize: 12, opacity: 0.7 }}>{label}</Text>
      <Text style={{ fontSize: 18, fontWeight: "700" }}>{value}</Text>
    </View>
  );
}

function StatusBanner({
  title,
  body,
  tone,
  actionLabel,
  onAction,
}: {
  title: string;
  body: string;
  tone: "warning" | "danger";
  actionLabel?: string;
  onAction?: () => void;
}) {
  const palette = tone === "danger"
    ? { borderColor: "#fca5a5", backgroundColor: "#fef2f2", titleColor: "#991b1b", bodyColor: "#7f1d1d" }
    : { borderColor: "#fcd34d", backgroundColor: "#fffbeb", titleColor: "#92400e", bodyColor: "#78350f" };

  return (
    <View style={{ borderWidth: 1, borderRadius: 10, padding: 12, gap: 8, borderColor: palette.borderColor, backgroundColor: palette.backgroundColor }}>
      <Text style={{ fontSize: 16, fontWeight: "700", color: palette.titleColor }}>{title}</Text>
      <Text style={{ color: palette.bodyColor }}>{body}</Text>
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} style={{ alignSelf: "flex-start", paddingVertical: 8, paddingHorizontal: 10, borderWidth: 1, borderRadius: 8, borderColor: palette.borderColor, backgroundColor: "white" }}>
          <Text style={{ color: palette.titleColor, fontWeight: "600" }}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const {
    game,
    saves,
    loading,
    error,
    advanceWeekConfirmation,
    createNewGame,
    loadSave,
    advanceWeek,
    dismissAdvanceWeekConfirmation,
    saveGame,
    refreshSaves,
  } = useGameSessionStore();

  if (!game) {
    return (
      <View style={{ flex: 1, padding: 16, gap: 12, backgroundColor: "#f8fafc" }}>
        <Text style={{ fontSize: 26, fontWeight: "700", color: "#0f172a" }}>Baseball Franchise Simulator</Text>
        <Text style={{ color: "#334155" }}>Build a club, survive the season, and try to earn promotion.</Text>
        <Pressable onPress={createNewGame} style={{ padding: 12, backgroundColor: "#1f2937", borderRadius: 8 }}>
          <Text style={{ color: "white", fontWeight: "600" }}>{loading ? "Creating..." : "Create New Game"}</Text>
        </Pressable>
        <Pressable onPress={refreshSaves} style={{ padding: 12, borderWidth: 1, borderRadius: 8, borderColor: "#cbd5e1", backgroundColor: "white" }}>
          <Text style={{ color: "#0f172a" }}>Refresh Saves</Text>
        </Pressable>
        {saves.slice(0, 3).map((save) => (
          <Pressable key={save.id} onPress={() => loadSave(save.id)} style={{ padding: 12, borderWidth: 1, borderRadius: 8, borderColor: "#cbd5e1", backgroundColor: "white" }}>
            <Text style={{ fontWeight: "700", color: "#0f172a" }}>{save.saveName}</Text>
            <Text style={{ color: "#475569" }}>{save.updatedAt}</Text>
          </Pressable>
        ))}
        {error ? <Text style={{ color: "#b91c1c" }}>{error}</Text> : null}
      </View>
    );
  }

  if (!game.story.introCompleted) {
    return <Redirect href="/intro" />;
  }

  const dashboard = getDashboardSnapshot(game);
  const latestCompletedWeek = getLatestCompletedWeek(game);
  const health = getTeamManagementHealthSnapshot(game);
  const highRiskLineupCount = health.lineupWarnings.filter((warning) => warning.riskLabel === "High").length;
  const highRiskRotationCount = health.rotationWarnings.filter((warning) => warning.riskLabel === "High").length;
  const nextOpponent = dashboard.nextGame
    ? `${game.teams[dashboard.nextGame.awayTeamId].nickname} @ ${game.teams[dashboard.nextGame.homeTeamId].nickname}`
    : "Season complete";

  const handleAdvanceWeek = async () => {
    if (loading || game.world.seasonStatus === "completed") {
      return;
    }

    const completedWeek = game.world.currentWeek;
    const advanced = await advanceWeek(Boolean(advanceWeekConfirmation));
    if (!advanced) {
      return;
    }

    router.push({ pathname: "/results", params: { week: String(completedWeek) } });
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12, backgroundColor: "#f8fafc" }}>
      <Text style={{ fontSize: 26, fontWeight: "700", color: "#0f172a" }}>{dashboard.team.name}</Text>
      <Text style={{ color: "#334155" }}>Week {game.world.currentWeek} / {game.world.weeksInSeason} | {game.world.currentDate}</Text>
      {error ? <Text style={{ color: "#b91c1c" }}>{error}</Text> : null}
      {advanceWeekConfirmation ? (
        <StatusBanner
          title="Injured Players Still Assigned"
          body={advanceWeekConfirmation.message}
          tone="danger"
          actionLabel="Review Lineup"
          onAction={() => {
            dismissAdvanceWeekConfirmation();
            router.push("/lineup");
          }}
        />
      ) : null}
      {!advanceWeekConfirmation && (highRiskLineupCount > 0 || highRiskRotationCount > 0) ? (
        <StatusBanner
          title="High Injury Risk In Current Plan"
          body={`Your current setup still includes ${highRiskLineupCount} high-risk lineup player(s) and ${highRiskRotationCount} high-risk starter(s). Consider resting them before you advance.`}
          tone="warning"
          actionLabel="Review Health"
          onAction={() => router.push("/lineup")}
        />
      ) : null}

      <DashboardCard label="Record" value={`${dashboard.standings.wins}-${dashboard.standings.losses}`} />
      <DashboardCard label="Cash" value={`$${dashboard.finances.currentCash.toLocaleString()}`} />
      <DashboardCard label="Fan Interest" value={String(dashboard.team.fanInterest)} />
      <DashboardCard label="Unread Mail" value={String(dashboard.unreadCount)} />
      <DashboardCard label="Next Game" value={nextOpponent} />

      <Pressable onPress={handleAdvanceWeek} style={{ padding: 12, backgroundColor: "#1f2937", borderRadius: 8 }}>
        <Text style={{ color: "white", fontWeight: "600" }}>
          {loading ? "Advancing..." : game.world.seasonStatus === "completed" ? "Season Complete" : advanceWeekConfirmation ? "Advance Anyway" : "Advance Week"}
        </Text>
      </Pressable>
      <Pressable onPress={saveGame} style={{ padding: 12, borderWidth: 1, borderRadius: 8, borderColor: "#cbd5e1", backgroundColor: "white" }}>
        <Text style={{ color: "#0f172a" }}>{loading ? "Saving..." : "Save Game"}</Text>
      </Pressable>

      {latestCompletedWeek ? <NavButton href="/results" label="Latest Results" /> : null}
      <NavButton href="/roster" label="Roster" />
      <NavButton href="/lineup" label="Lineup" />
      <NavButton href="/standings" label="Standings" />
      <NavButton href="/schedule" label="Schedule" />
      <NavButton href="/finances" label="Finances" />
      <NavButton href="/promotion" label="Promotion Tracker" />
      <NavButton href="/inbox" label="Inbox" />
      <NavButton href="/saves" label="Save / Load" />
      {dashboard.seasonSummary ? <NavButton href="/summary" label="Season Summary" /> : null}
      {dashboard.seasonSummary && !dashboard.seasonSummary.promotion.promoted ? <NavButton href="/promotion-plan" label="Promotion Action Plan" /> : null}
    </ScrollView>
  );
}
