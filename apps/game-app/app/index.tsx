import { Link } from "expo-router";
import { Text, View, Pressable } from "react-native";
import { useGameSessionStore } from "../src/stores/gameSessionStore";
import { DashboardCard } from "@baseball-sim/ui";

export default function HomeScreen() {
  const { game, createNewGame, advanceWeek } = useGameSessionStore();

  return (
    <View style={{ flex: 1, padding: 16, gap: 12 }}>
      {!game ? (
        <>
          <Text style={{ fontSize: 24, fontWeight: "700" }}>Baseball Franchise Simulator</Text>
          <Text>Start a new franchise to generate your first season.</Text>
          <Pressable onPress={createNewGame} style={{ padding: 12, backgroundColor: "#1f2937", borderRadius: 8 }}>
            <Text style={{ color: "white", fontWeight: "600" }}>Create New Game</Text>
          </Pressable>
        </>
      ) : (
        <>
          <Text style={{ fontSize: 24, fontWeight: "700" }}>{game.teams[game.world.userTeamId].name}</Text>
          <Text>Week {game.world.currentWeek} · {game.world.currentDate}</Text>

          <DashboardCard label="Cash" value={`$${game.teams[game.world.userTeamId].cash.toLocaleString()}`} />
          <DashboardCard label="Fan Interest" value={String(game.teams[game.world.userTeamId].fanInterest)} />
          <DashboardCard label="League" value={game.leagues[game.teams[game.world.userTeamId].leagueId].name} />

          <Pressable onPress={advanceWeek} style={{ padding: 12, backgroundColor: "#1f2937", borderRadius: 8 }}>
            <Text style={{ color: "white", fontWeight: "600" }}>Advance Week</Text>
          </Pressable>

          <Link href="/roster" asChild>
            <Pressable style={{ padding: 12, borderWidth: 1, borderRadius: 8 }}>
              <Text>Roster</Text>
            </Pressable>
          </Link>

          <Link href="/standings" asChild>
            <Pressable style={{ padding: 12, borderWidth: 1, borderRadius: 8 }}>
              <Text>Standings</Text>
            </Pressable>
          </Link>

          <Link href="/schedule" asChild>
            <Pressable style={{ padding: 12, borderWidth: 1, borderRadius: 8 }}>
              <Text>Schedule</Text>
            </Pressable>
          </Link>

          <Link href="/finances" asChild>
            <Pressable style={{ padding: 12, borderWidth: 1, borderRadius: 8 }}>
              <Text>Finances</Text>
            </Pressable>
          </Link>
        </>
      )}
    </View>
  );
}
