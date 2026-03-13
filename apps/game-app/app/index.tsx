import { Link } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { DashboardCard } from "@baseball-sim/ui";
import { getDashboardSnapshot } from "@baseball-sim/game-core";
import { useGameSessionStore } from "../src/stores/gameSessionStore";

function NavButton({ href, label }: { href: "/roster" | "/lineup" | "/standings" | "/schedule" | "/finances" | "/promotion" | "/inbox" | "/summary" | "/saves"; label: string }) {
  return (
    <Link href={href} asChild>
      <Pressable style={{ padding: 12, borderWidth: 1, borderRadius: 8 }}>
        <Text>{label}</Text>
      </Pressable>
    </Link>
  );
}

export default function HomeScreen() {
  const { game, saves, loading, error, createNewGame, loadSave, advanceWeek, saveGame, refreshSaves } = useGameSessionStore();

  if (!game) {
    return (
      <View style={{ flex: 1, padding: 16, gap: 12 }}>
        <Text style={{ fontSize: 26, fontWeight: "700" }}>Baseball Franchise Simulator</Text>
        <Text>Build a club, survive the season, and try to earn promotion.</Text>
        <Pressable onPress={createNewGame} style={{ padding: 12, backgroundColor: "#1f2937", borderRadius: 8 }}>
          <Text style={{ color: "white", fontWeight: "600" }}>{loading ? "Creating..." : "Create New Game"}</Text>
        </Pressable>
        <Pressable onPress={refreshSaves} style={{ padding: 12, borderWidth: 1, borderRadius: 8 }}>
          <Text>Refresh Saves</Text>
        </Pressable>
        {saves.slice(0, 3).map((save) => (
          <Pressable key={save.id} onPress={() => loadSave(save.id)} style={{ padding: 12, borderWidth: 1, borderRadius: 8 }}>
            <Text style={{ fontWeight: "700" }}>{save.saveName}</Text>
            <Text>{save.updatedAt}</Text>
          </Pressable>
        ))}
        {error ? <Text style={{ color: "#b91c1c" }}>{error}</Text> : null}
      </View>
    );
  }

  const dashboard = getDashboardSnapshot(game);
  const nextOpponent = dashboard.nextGame
    ? `${game.teams[dashboard.nextGame.awayTeamId].nickname} @ ${game.teams[dashboard.nextGame.homeTeamId].nickname}`
    : "Season complete";

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 26, fontWeight: "700" }}>{dashboard.team.name}</Text>
      <Text>Week {game.world.currentWeek} / {game.world.weeksInSeason} | {game.world.currentDate}</Text>
      {error ? <Text style={{ color: "#b91c1c" }}>{error}</Text> : null}

      <DashboardCard label="Record" value={`${dashboard.standings.wins}-${dashboard.standings.losses}`} />
      <DashboardCard label="Cash" value={`$${dashboard.finances.currentCash.toLocaleString()}`} />
      <DashboardCard label="Fan Interest" value={String(dashboard.team.fanInterest)} />
      <DashboardCard label="Unread Mail" value={String(dashboard.unreadCount)} />
      <DashboardCard label="Next Game" value={nextOpponent} />

      <Pressable onPress={advanceWeek} style={{ padding: 12, backgroundColor: "#1f2937", borderRadius: 8 }}>
        <Text style={{ color: "white", fontWeight: "600" }}>{loading ? "Advancing..." : game.world.seasonStatus === "completed" ? "Season Complete" : "Advance Week"}</Text>
      </Pressable>
      <Pressable onPress={saveGame} style={{ padding: 12, borderWidth: 1, borderRadius: 8 }}>
        <Text>{loading ? "Saving..." : "Save Game"}</Text>
      </Pressable>

      <NavButton href="/roster" label="Roster" />
      <NavButton href="/lineup" label="Lineup" />
      <NavButton href="/standings" label="Standings" />
      <NavButton href="/schedule" label="Schedule" />
      <NavButton href="/finances" label="Finances" />
      <NavButton href="/promotion" label="Promotion Tracker" />
      <NavButton href="/inbox" label="Inbox" />
      <NavButton href="/saves" label="Save / Load" />
      {dashboard.seasonSummary ? <NavButton href="/summary" label="Season Summary" /> : null}
    </ScrollView>
  );
}
