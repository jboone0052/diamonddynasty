import type { ReactNode } from "react";
import { Link, useLocalSearchParams } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { getWeeklyResultsSnapshot } from "@baseball-sim/game-core";
import { useGameSessionStore } from "../src/stores/gameSessionStore";

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ borderWidth: 1, borderRadius: 12, padding: 14, borderColor: "#cbd5e1", backgroundColor: "white", gap: 4, flex: 1 }}>
      <Text style={{ fontSize: 12, color: "#64748b" }}>{label}</Text>
      <Text style={{ fontSize: 18, fontWeight: "700", color: "#0f172a" }}>{value}</Text>
    </View>
  );
}

function SectionCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={{ borderWidth: 1, borderRadius: 12, padding: 16, borderColor: "#dbe2ea", backgroundColor: "white", gap: 10 }}>
      <Text style={{ fontSize: 18, fontWeight: "700", color: "#0f172a" }}>{title}</Text>
      {children}
    </View>
  );
}

function StatRow({ left, right }: { left: string; right: string }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
      <Text style={{ color: "#334155", flex: 1 }}>{left}</Text>
      <Text style={{ color: "#0f172a", fontWeight: "600" }}>{right}</Text>
    </View>
  );
}

function BoxScoreRow({
  label,
  runs,
  hits,
  errors,
  accent,
}: {
  label: string;
  runs: number;
  hits: number;
  errors: number;
  accent: string;
}) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={{ fontWeight: "700", color: accent }}>{label}</Text>
      <View style={{ flexDirection: "row", borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 10, overflow: "hidden" }}>
        {[
          { key: "R", value: runs },
          { key: "H", value: hits },
          { key: "E", value: errors },
        ].map((item) => (
          <View
            key={`${label}-${item.key}`}
            style={{ flex: 1, paddingVertical: 10, paddingHorizontal: 12, backgroundColor: item.key === "R" ? "#f8fafc" : "white", gap: 2 }}
          >
            <Text style={{ fontSize: 11, fontWeight: "700", color: "#64748b", textAlign: "center" }}>{item.key}</Text>
            <Text style={{ fontSize: 18, fontWeight: "800", color: "#0f172a", textAlign: "center" }}>{item.value}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export default function ResultsScreen() {
  const { game } = useGameSessionStore();
  const params = useLocalSearchParams<{ week?: string }>();

  if (!game) {
    return <View style={{ padding: 16 }}><Text>No active save.</Text></View>;
  }

  const requestedWeek = typeof params.week === "string" ? Number(params.week) : undefined;
  const snapshot = getWeeklyResultsSnapshot(game, Number.isFinite(requestedWeek) ? requestedWeek : undefined);

  if (!snapshot) {
    return (
      <View style={{ padding: 16, gap: 10 }}>
        <Text style={{ fontSize: 22, fontWeight: "700" }}>Weekly Results</Text>
        <Text>No completed week recap is available yet.</Text>
      </View>
    );
  }

  const userGame = snapshot.userGame;
  const userTeamId = game.world.userTeamId;
  const userWon = userGame?.result?.winningTeamId === userTeamId;
  const homeTeam = userGame ? game.teams[userGame.homeTeamId] : null;
  const awayTeam = userGame ? game.teams[userGame.awayTeamId] : null;

  const getTeamBattingTotals = (teamId: string) => {
    if (!userGame?.result) {
      return { hits: 0, walks: 0, strikeouts: 0, homeRuns: 0 };
    }

    const rosterIds = new Set(game.teams[teamId].rosterPlayerIds);
    return Object.values(userGame.result.boxScore.battingLines)
      .filter((line) => rosterIds.has(line.playerId))
      .reduce((totals, line) => ({
        hits: totals.hits + line.hits,
        walks: totals.walks + line.walks,
        strikeouts: totals.strikeouts + line.strikeouts,
        homeRuns: totals.homeRuns + line.homeRuns,
      }), { hits: 0, walks: 0, strikeouts: 0, homeRuns: 0 });
  };

  const battingRows = (teamId: string) => {
    if (!userGame?.result) {
      return [];
    }

    const rosterIds = new Set(game.teams[teamId].rosterPlayerIds);
    const lineupOrder = game.teams[teamId].activeLineup.battingOrderPlayerIds;

    return Object.values(userGame.result.boxScore.battingLines)
      .filter((line) => rosterIds.has(line.playerId))
      .sort((a, b) => lineupOrder.indexOf(a.playerId) - lineupOrder.indexOf(b.playerId));
  };

  const pitchingRows = (teamId: string) => {
    if (!userGame?.result) {
      return [];
    }

    const rosterIds = new Set(game.teams[teamId].rosterPlayerIds);

    return Object.values(userGame.result.boxScore.pitchingLines)
      .filter((line) => rosterIds.has(line.playerId))
      .sort((a, b) => b.inningsPitched - a.inningsPitched || b.strikeouts - a.strikeouts);
  };

  const awayTotals = userGame ? getTeamBattingTotals(userGame.awayTeamId) : { hits: 0, walks: 0, strikeouts: 0, homeRuns: 0 };
  const homeTotals = userGame ? getTeamBattingTotals(userGame.homeTeamId) : { hits: 0, walks: 0, strikeouts: 0, homeRuns: 0 };

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 14, backgroundColor: "#f8fafc" }}>
      <View style={{ gap: 4 }}>
        <Text style={{ fontSize: 28, fontWeight: "800", color: "#0f172a" }}>Week {snapshot.week} Results</Text>
        <Text style={{ color: "#475569" }}>
          Review your club&apos;s final first, then the box score and the rest of the league.
        </Text>
      </View>

      {userGame?.result ? (
        <>
          <SectionCard title="Your Game">
            <Text style={{ fontWeight: "700", color: userWon ? "#166534" : "#991b1b" }}>{userWon ? "Win" : "Loss"}</Text>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={{ color: "#0f172a", fontSize: 22, fontWeight: "800" }}>
                  {awayTeam?.nickname} {userGame.result.awayScore}, {homeTeam?.nickname} {userGame.result.homeScore}
                </Text>
                <Text style={{ color: "#475569" }}>
                  {userGame.awayTeamId === userTeamId ? "Road game" : "Home game"} on {userGame.date}
                </Text>
              </View>
              <View style={{ paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, backgroundColor: userWon ? "#dcfce7" : "#fee2e2" }}>
                <Text style={{ fontSize: 18, fontWeight: "800", color: userWon ? "#166534" : "#991b1b" }}>{userWon ? "W" : "L"}</Text>
              </View>
            </View>
            <StatRow left="Attendance" right={userGame.result.attendance.toLocaleString()} />
            <StatRow left="Innings" right={String(userGame.result.inningsPlayed)} />
            <StatRow left="Winning Pitcher" right={userGame.result.winningPitcherId ? game.players[userGame.result.winningPitcherId].fullName : "TBD"} />
            <StatRow left="Losing Pitcher" right={userGame.result.losingPitcherId ? game.players[userGame.result.losingPitcherId].fullName : "TBD"} />
            <StatRow left={`${awayTeam?.nickname} batting`} right={`${awayTotals.hits} H | ${awayTotals.walks} BB | ${awayTotals.strikeouts} SO | ${awayTotals.homeRuns} HR`} />
            <StatRow left={`${homeTeam?.nickname} batting`} right={`${homeTotals.hits} H | ${homeTotals.walks} BB | ${homeTotals.strikeouts} SO | ${homeTotals.homeRuns} HR`} />
          </SectionCard>

          <SectionCard title="Team Box Score">
            <BoxScoreRow
              label={awayTeam?.nickname ?? "Away"}
              runs={userGame.result.awayScore}
              hits={awayTotals.hits}
              errors={userGame.result.boxScore.errorsByTeam[userGame.awayTeamId] ?? 0}
              accent={userGame.awayTeamId === userTeamId ? "#1d4ed8" : "#0f172a"}
            />
            <BoxScoreRow
              label={homeTeam?.nickname ?? "Home"}
              runs={userGame.result.homeScore}
              hits={homeTotals.hits}
              errors={userGame.result.boxScore.errorsByTeam[userGame.homeTeamId] ?? 0}
              accent={userGame.homeTeamId === userTeamId ? "#1d4ed8" : "#0f172a"}
            />
          </SectionCard>

          <SectionCard title="Key Moments">
            {userGame.result.notableEvents.length > 0 ? userGame.result.notableEvents.map((event, index) => (
              <Text key={`${userGame.id}-event-${index}`} style={{ color: "#334155" }}>
                - {event}
              </Text>
            )) : <Text style={{ color: "#475569" }}>No standout moments were recorded.</Text>}
            {(userGame.result.playByPlay ?? []).slice(0, 5).map((entry, index) => (
              <Text key={`${userGame.id}-pbp-${index}`} style={{ color: "#475569" }}>{index + 1}. {entry}</Text>
            ))}
          </SectionCard>

          <SectionCard title={`${game.teams[userGame.homeTeamId].nickname} Batting`}>
            {battingRows(userGame.homeTeamId).map((line) => (
              <StatRow
                key={`home-bat-${line.playerId}`}
                left={`${game.players[line.playerId].fullName}  ${line.hits}-${line.atBats}, ${line.rbi} RBI`}
                right={`${line.homeRuns} HR | ${line.walks} BB | ${line.strikeouts} SO`}
              />
            ))}
          </SectionCard>

          <SectionCard title={`${game.teams[userGame.awayTeamId].nickname} Batting`}>
            {battingRows(userGame.awayTeamId).map((line) => (
              <StatRow
                key={`away-bat-${line.playerId}`}
                left={`${game.players[line.playerId].fullName}  ${line.hits}-${line.atBats}, ${line.rbi} RBI`}
                right={`${line.homeRuns} HR | ${line.walks} BB | ${line.strikeouts} SO`}
              />
            ))}
          </SectionCard>

          <SectionCard title="Pitching Lines">
            <Text style={{ fontWeight: "600", color: "#0f172a" }}>{game.teams[userGame.homeTeamId].nickname}</Text>
            {pitchingRows(userGame.homeTeamId).map((line) => (
              <StatRow
                key={`home-pitch-${line.playerId}`}
                left={`${game.players[line.playerId].fullName}  ${line.inningsPitched.toFixed(1)} IP`}
                right={`${line.hitsAllowed} H | ${line.walks} BB | ${line.earnedRuns} ER | ${line.strikeouts} SO`}
              />
            ))}
            <Text style={{ fontWeight: "600", color: "#0f172a", marginTop: 6 }}>{game.teams[userGame.awayTeamId].nickname}</Text>
            {pitchingRows(userGame.awayTeamId).map((line) => (
              <StatRow
                key={`away-pitch-${line.playerId}`}
                left={`${game.players[line.playerId].fullName}  ${line.inningsPitched.toFixed(1)} IP`}
                right={`${line.hitsAllowed} H | ${line.walks} BB | ${line.earnedRuns} ER | ${line.strikeouts} SO`}
              />
            ))}
          </SectionCard>

          <View style={{ flexDirection: "row", gap: 8 }}>
            <SummaryCard label="Record" value={`${snapshot.standingsRow.wins}-${snapshot.standingsRow.losses}`} />
            <SummaryCard label="Rank" value={`#${snapshot.ranking}`} />
          </View>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <SummaryCard label="Run Differential" value={String(snapshot.standingsRow.runDifferential)} />
            <SummaryCard label="Streak" value={snapshot.standingsRow.streak > 0 ? `W${snapshot.standingsRow.streak}` : snapshot.standingsRow.streak < 0 ? `L${Math.abs(snapshot.standingsRow.streak)}` : "Even"} />
          </View>
        </>
      ) : null}

      <SectionCard title="League Scoreboard">
        {snapshot.games.map((gameItem) => (
          <View key={gameItem.id} style={{ gap: 2 }}>
            <Text style={{ fontWeight: "700", color: "#0f172a" }}>
              {game.teams[gameItem.awayTeamId].nickname} {gameItem.result?.awayScore} at {game.teams[gameItem.homeTeamId].nickname} {gameItem.result?.homeScore}
            </Text>
            <Text style={{ color: "#475569" }}>{gameItem.date} | Attendance {gameItem.result?.attendance.toLocaleString()}</Text>
          </View>
        ))}
      </SectionCard>

      <View style={{ gap: 10 }}>
        <Link href="/schedule" asChild>
          <Pressable style={{ padding: 14, borderRadius: 10, borderWidth: 1, borderColor: "#cbd5e1", backgroundColor: "white" }}>
            <Text style={{ color: "#0f172a", fontWeight: "600", textAlign: "center" }}>Open Full Schedule</Text>
          </Pressable>
        </Link>
        {snapshot.seasonSummary ? (
          <Link href="/summary" asChild>
            <Pressable style={{ padding: 14, borderRadius: 10, backgroundColor: "#1f2937" }}>
              <Text style={{ color: "white", fontWeight: "700", textAlign: "center" }}>Open Season Summary</Text>
            </Pressable>
          </Link>
        ) : null}
        <Link href="/" asChild>
          <Pressable style={{ padding: 14, borderRadius: 10, borderWidth: 1, borderColor: "#cbd5e1", backgroundColor: "white" }}>
            <Text style={{ color: "#0f172a", fontWeight: "600", textAlign: "center" }}>Return to Dashboard</Text>
          </Pressable>
        </Link>
      </View>
    </ScrollView>
  );
}
