import { Link, Redirect } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { getPromotionStatus } from "@baseball-sim/game-core";
import { useGameSessionStore } from "../src/stores/gameSessionStore";

type ActionLink = "/finances" | "/roster" | "/lineup" | "/standings" | "/promotion";

function ActionCard({
  title,
  summary,
  why,
  href,
  cta,
}: {
  title: string;
  summary: string;
  why: string;
  href: ActionLink;
  cta: string;
}) {
  return (
    <View style={{ borderWidth: 1, borderRadius: 12, padding: 14, gap: 8, borderColor: "#cbd5e1", backgroundColor: "white" }}>
      <Text style={{ fontSize: 17, fontWeight: "700", color: "#0f172a" }}>{title}</Text>
      <Text style={{ color: "#334155" }}>{summary}</Text>
      <Text style={{ color: "#475569" }}>{why}</Text>
      <Link href={href} asChild>
        <Pressable style={{ alignSelf: "flex-start", paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: "#0f172a" }}>
          <Text style={{ color: "#0f172a", fontWeight: "600" }}>{cta}</Text>
        </Pressable>
      </Link>
    </View>
  );
}

export default function PromotionPlanScreen() {
  const { game } = useGameSessionStore();

  if (!game) {
    return <View style={{ padding: 16 }}><Text>No active save.</Text></View>;
  }

  const summary = game.seasonSummary;
  if (!summary) {
    return <Redirect href="/promotion" />;
  }

  if (summary.promotion.promoted) {
    return <Redirect href="/summary" />;
  }

  const userTeam = game.teams[game.world.userTeamId];
  const league = game.leagues[userTeam.leagueId];
  const status = getPromotionStatus(game);

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12, backgroundColor: "#f8fafc" }}>
      <Text style={{ fontSize: 28, fontWeight: "700", color: "#0f172a" }}>Promotion Action Plan</Text>
      <Text style={{ color: "#334155" }}>
        You missed promotion this season. Address the gaps below, then push for a top {league.promotionSpots} finish next year.
      </Text>

      <ActionCard
        title="Increase stadium capacity"
        summary={`Current capacity is ${game.stadiums[userTeam.stadiumId].capacity.toLocaleString()} seats; promotion target is ${league.minStadiumCapacityForPromotion.toLocaleString()}.`}
        why={status.stadiumRequirementMet ? "You already cleared this requirement, but expanding can still improve attendance ceiling." : "Capacity requirement is currently missed."}
        href="/finances"
        cta="Open Finances"
      />

      <ActionCard
        title="Raise attendance"
        summary={`Current attendance rank check: ${status.attendanceRequirementMet ? "met" : "not met"}. Improve demand with wins, stronger roster quality, and better fan momentum.`}
        why="Higher attendance helps meet promotion rules and funds payroll upgrades."
        href="/standings"
        cta="Review Standings"
      />

      <ActionCard
        title="Make roster upgrades"
        summary="Release weak fits and sign better free agents to improve your weekly matchups."
        why="Better roster strength improves win rate and keeps you in the promotion race."
        href="/roster"
        cta="Open Roster Moves"
      />

      <ActionCard
        title="Optimize lineup and rotation"
        summary="Reorder batting slots and starters to maximize healthy players in high-leverage spots."
        why="Better deployment turns close games into wins over a full season."
        href="/lineup"
        cta="Adjust Lineup"
      />

      <ActionCard
        title="Track every requirement"
        summary="Monitor rank, cash reserve, attendance, and stadium benchmarks all season."
        why="Use the tracker to avoid missing a single requirement at year end."
        href="/promotion"
        cta="Open Promotion Tracker"
      />
    </ScrollView>
  );
}
