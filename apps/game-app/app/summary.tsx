import { Link, useRouter } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { getSeasonSponsorshipSnapshot, getStandingsSnapshot } from "@baseball-sim/game-core";
import { useGameSessionStore } from "../src/stores/gameSessionStore";

function formatCurrency(value: number) {
  const sign = value < 0 ? "-" : "";
  return `${sign}$${Math.abs(Math.round(value)).toLocaleString()}`;
}

function StatusPill({ label, passed }: { label: string; passed: boolean }) {
  return (
    <View style={{ borderRadius: 999, paddingVertical: 6, paddingHorizontal: 10, backgroundColor: passed ? "#dcfce7" : "#fee2e2" }}>
      <Text style={{ color: passed ? "#166534" : "#991b1b", fontWeight: "700" }}>{label}</Text>
    </View>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ borderWidth: 1, borderRadius: 12, padding: 14, gap: 10, borderColor: "#cbd5e1", backgroundColor: "white" }}>
      <Text style={{ fontSize: 18, fontWeight: "700", color: "#0f172a" }}>{title}</Text>
      {children}
    </View>
  );
}

function StatRow({ label, value, valueTone = "#0f172a" }: { label: string; value: string; valueTone?: string }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
      <Text style={{ color: "#475569", flex: 1 }}>{label}</Text>
      <Text style={{ color: valueTone, fontWeight: "700", textAlign: "right", flexShrink: 1 }}>{value}</Text>
    </View>
  );
}

export default function SummaryScreen() {
  const { game } = useGameSessionStore();
  if (!game || !game.seasonSummary) return <View style={{ padding: 16 }}><Text>No season summary yet.</Text></View>;

  const team = game.teams[game.world.userTeamId];
  const league = game.leagues[team.leagueId];
  const finances = game.finances[team.id];
  const stadium = game.stadiums[team.stadiumId];
  const standings = getStandingsSnapshot(game, league.id);
  const sponsorship = getSeasonSponsorshipSnapshot(game, team.id);
  const userRow = standings.find((row) => row.teamId === team.id)!;
  const summary = game.seasonSummary;
  const totalRevenue = Object.values(finances.seasonRevenueBreakdown).reduce((sum, value) => sum + value, 0);
  const totalExpenses = Object.values(finances.seasonExpenseBreakdown).reduce((sum, value) => sum + value, 0);
  const netSettlement = totalRevenue - totalExpenses;
  const latestRevenue = Object.values(finances.lastMonthRevenueBreakdown).reduce((sum, value) => sum + value, 0);
  const latestExpenses = Object.values(finances.lastMonthExpenseBreakdown).reduce((sum, value) => sum + value, 0);
  const canStartNextSeason = !summary.promotion.promoted;
  const promotionChecks = [
    {
      label: `Finish top ${league.promotionSpots}`,
      detail: `Closed the year in ${summary.promotion.finalRank}${summary.promotion.finalRank === 1 ? "st" : summary.promotion.finalRank === 2 ? "nd" : summary.promotion.finalRank === 3 ? "rd" : "th"} place.`,
      passed: summary.promotion.qualifiedByRank,
    },
    {
      label: `Reach ${league.minStadiumCapacityForPromotion.toLocaleString()} seats`,
      detail: `${stadium.capacity.toLocaleString()} seat capacity at ${stadium.name}.`,
      passed: summary.promotion.stadiumRequirementMet,
    },
    {
      label: `Average ${league.minAverageAttendanceForPromotion.toLocaleString()} attendance`,
      detail: `${userRow.averageAttendance.toLocaleString()} average home attendance.`,
      passed: summary.promotion.attendanceRequirementMet,
    },
    {
      label: `Hold ${formatCurrency(league.minCashReserveForPromotion)} in cash reserve`,
      detail: `${formatCurrency(finances.currentCash)} closing cash with ${formatCurrency(finances.currentDebt)} debt.`,
      passed: summary.promotion.cashRequirementMet,
    },
  ];

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12, backgroundColor: "#f8fafc" }}>
      <View style={{ gap: 8 }}>
        <Text style={{ fontSize: 28, fontWeight: "700", color: "#0f172a" }}>Season Summary</Text>
        <Text style={{ color: "#334155", fontSize: 16 }}>{summary.message}</Text>
        <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
          <StatusPill label={summary.promotion.promoted ? "Promotion Earned" : "Promotion Missed"} passed={summary.promotion.promoted} />
          <StatusPill label={`Champion: ${game.teams[summary.championTeamId].nickname}`} passed />
        </View>
      </View>

      <SectionCard title="Your Finish">
        <StatRow label="Club" value={team.name} />
        <StatRow label="Final record" value={`${userRow.wins}-${userRow.losses}`} />
        <StatRow label="Final rank" value={`${summary.promotion.finalRank} / ${standings.length}`} />
        <StatRow label="Run differential" value={userRow.runDifferential >= 0 ? `+${userRow.runDifferential}` : String(userRow.runDifferential)} valueTone={userRow.runDifferential >= 0 ? "#166534" : "#991b1b"} />
        <StatRow label="Average attendance" value={userRow.averageAttendance.toLocaleString()} />
        <StatRow label="Season verdict" value={summary.promotion.summary} valueTone={summary.promotion.promoted ? "#166534" : "#991b1b"} />
      </SectionCard>

      <SectionCard title="Promotion Review">
        {promotionChecks.map((item) => (
          <View key={item.label} style={{ borderWidth: 1, borderRadius: 10, padding: 12, gap: 6, borderColor: item.passed ? "#86efac" : "#fca5a5", backgroundColor: item.passed ? "#f0fdf4" : "#fef2f2" }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
              <Text style={{ fontWeight: "700", color: "#0f172a", flex: 1 }}>{item.label}</Text>
              <StatusPill label={item.passed ? "Met" : "Missed"} passed={item.passed} />
            </View>
            <Text style={{ color: item.passed ? "#166534" : "#7f1d1d" }}>{item.detail}</Text>
          </View>
        ))}
      </SectionCard>

      <SectionCard title="Final Standings">
        {standings.map((row, index) => {
          const standingTeam = game.teams[row.teamId];
          const isUserTeam = row.teamId === team.id;
          return (
            <View
              key={row.teamId}
              style={{
                borderWidth: 1,
                borderRadius: 10,
                padding: 12,
                gap: 4,
                borderColor: isUserTeam ? "#93c5fd" : "#e2e8f0",
                backgroundColor: isUserTeam ? "#eff6ff" : "#ffffff",
              }}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
                <Text style={{ fontWeight: "700", color: "#0f172a", flex: 1 }}>
                  {index + 1}. {standingTeam.name}
                </Text>
                <Text style={{ color: "#475569" }}>{row.wins}-{row.losses}</Text>
              </View>
              <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
                <Text style={{ color: "#475569" }}>RD {row.runDifferential >= 0 ? `+${row.runDifferential}` : row.runDifferential}</Text>
                <Text style={{ color: "#475569" }}>AVG ATT {row.averageAttendance.toLocaleString()}</Text>
              </View>
            </View>
          );
        })}
      </SectionCard>



      {!summary.promotion.promoted ? (
        <SectionCard title="Missed Promotion? Next Steps">
          <Text style={{ color: "#334155" }}>
            Get a focused checklist with direct actions to improve your chances next season.
          </Text>
          <Link href="/promotion-plan" asChild>
            <Pressable style={{ alignSelf: "flex-start", paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: "#0f172a", backgroundColor: "#0f172a" }}>
              <Text style={{ color: "white", fontWeight: "700" }}>Open Promotion Action Plan</Text>
            </Pressable>
          </Link>
        </SectionCard>
      ) : null}

      <SectionCard title="Financial Outcome">
        <StatRow label="Closing cash" value={formatCurrency(finances.currentCash)} valueTone={finances.currentCash > 0 ? "#166534" : "#0f172a"} />
        <StatRow label="Outstanding debt" value={formatCurrency(finances.currentDebt)} valueTone={finances.currentDebt > 0 ? "#991b1b" : "#166534"} />
        <StatRow label="Ticket price" value={formatCurrency(finances.ticketPrice)} />
        <StatRow label="Sponsor revenue (current monthly)" value={formatCurrency(sponsorship.currentRevenueMonthly)} />
        <StatRow label="Sponsor deal entering season" value={formatCurrency(sponsorship.currentBaseRevenueMonthly)} />
        <StatRow label="Season sponsorship revenue" value={formatCurrency(sponsorship.seasonSponsorshipRevenue)} valueTone="#166534" />
        <StatRow
          label={`Projected next-season sponsor deal (${sponsorship.previousSeasonWins}-${league.seasonLength - sponsorship.previousSeasonWins} to ${sponsorship.completedSeasonWins}-${league.seasonLength - sponsorship.completedSeasonWins})`}
          value={`${formatCurrency(sponsorship.projectedNextSeasonBase)} (${sponsorship.projectedChange >= 0 ? "+" : ""}${formatCurrency(sponsorship.projectedChange)} / ${sponsorship.projectedChangePct >= 0 ? "+" : ""}${sponsorship.projectedChangePct}%)`}
          valueTone={sponsorship.projectedChange >= 0 ? "#166534" : "#991b1b"}
        />
        <StatRow label="Merchandise strength" value={String(finances.merchandiseStrength)} />
        <StatRow label="Season revenue" value={formatCurrency(totalRevenue)} valueTone="#166534" />
        <StatRow label="Season expenses" value={formatCurrency(totalExpenses)} valueTone="#991b1b" />
        <StatRow label="Season operating result" value={formatCurrency(netSettlement)} valueTone={netSettlement >= 0 ? "#166534" : "#991b1b"} />
        <StatRow label="Latest weekly revenue" value={formatCurrency(latestRevenue)} valueTone="#166534" />
        <StatRow label="Latest weekly expenses" value={formatCurrency(latestExpenses)} valueTone="#991b1b" />
      </SectionCard>
    </ScrollView>
  );
}


