import { economyConfig, worldConfig } from "@baseball-sim/config";
import { startingLeague, startingTeams } from "@baseball-sim/content";
import { createPlayer } from "./createPlayer";
import { GameState, LeagueStandings, ScheduledGame, Team } from "../types/gameState";

function makeDate(week: number) {
  const day = 1 + (week - 1) * 7;
  return `2027-04-${String(Math.min(day, 28)).padStart(2, "0")}`;
}

export function createNewGame(): GameState {
  const seed = "starter-seed";
  const userTeamId = "team_harbor_city";

  const leagues = {
    [startingLeague.id]: {
      ...startingLeague,
      teamIds: startingTeams.map((t) => t.id),
      seasonLength: worldConfig.gamesPerTeam,
      promotionSpots: 2,
      relegationSpots: 0,
      minStadiumCapacityForPromotion: 2000,
      minAverageAttendanceForPromotion: 800,
      minCashReserveForPromotion: 50000,
    },
  };

  const stadiumCaps: Record<string, number> = {
    team_harbor_city: 1200,
    team_iron_valley: 1800,
    team_bayport: 2200,
    team_redwood: 1400,
    team_capital_city: 2600,
    team_dockside: 1100,
    team_pine_ridge: 1000,
    team_lakefront: 1500,
  };

  const teams: Record<string, Team> = {};
  const players: GameState["players"] = {};
  const stadiums: GameState["stadiums"] = {};
  const finances: GameState["finances"] = {};

  let playerCounter = 1;

  for (const base of startingTeams) {
    const rosterIds: string[] = [];
    for (let i = 0; i < 22; i += 1) {
      const id = `player_${String(playerCounter).padStart(5, "0")}`;
      const player = createPlayer(id, seed, playerCounter * 31, base.id);
      players[id] = player;
      rosterIds.push(id);
      playerCounter += 1;
    }

    stadiums[`stadium_${base.id}`] = {
      id: `stadium_${base.id}`,
      name: `${base.city} Field`,
      city: base.city,
      capacity: stadiumCaps[base.id],
      condition: 55,
      fanExperience: 45,
      fieldQuality: 50,
      lightingQuality: 50,
    };

    teams[base.id] = {
      id: base.id,
      name: base.name,
      nickname: base.nickname,
      city: base.city,
      marketSize: base.id === "team_capital_city" ? 70 : base.id === "team_bayport" ? 55 : 40,
      prestige: base.id === "team_capital_city" ? 60 : 30,
      fanInterest: base.id === userTeamId ? 30 : 40,
      morale: 55,
      cash: base.id === userTeamId ? 250000 : 320000,
      debt: base.id === userTeamId ? 80000 : 40000,
      stadiumId: `stadium_${base.id}`,
      leagueId: startingLeague.id,
      rosterPlayerIds: rosterIds,
      activeLineup: {
        battingOrderPlayerIds: rosterIds.slice(0, 9),
        defensiveAssignments: {
          C: rosterIds[0], "1B": rosterIds[1], "2B": rosterIds[2], "3B": rosterIds[3],
          SS: rosterIds[4], LF: rosterIds[5], CF: rosterIds[6], RF: rosterIds[7], DH: rosterIds[8]
        },
      },
      rotation: {
        starterPlayerIds: rosterIds.slice(9, 14),
        nextStarterIndex: 0,
      },
      bullpenPlayerIds: rosterIds.slice(14, 18),
      isHumanControlled: base.id === userTeamId,
    };

    finances[base.id] = {
      teamId: base.id,
      currentCash: teams[base.id].cash,
      currentDebt: teams[base.id].debt,
      payrollMonthly: 22 * economyConfig.averagePayrollPerPlayerMonthly,
      sponsorRevenueMonthly: economyConfig.baseSponsorRevenueMonthly,
      ticketPrice: economyConfig.baseTicketPrice,
    };
  }

  const schedule: Record<string, ScheduledGame> = {};
  let gameCounter = 1;

  // simple weekly pairings scaffold
  for (let week = 1; week <= 7; week += 1) {
    const pairings = [
      [startingTeams[0].id, startingTeams[1].id],
      [startingTeams[2].id, startingTeams[3].id],
      [startingTeams[4].id, startingTeams[5].id],
      [startingTeams[6].id, startingTeams[7].id],
    ];
    for (const [homeTeamId, awayTeamId] of pairings) {
      const id = `game_${String(gameCounter).padStart(4, "0")}`;
      schedule[id] = {
        id,
        leagueId: startingLeague.id,
        season: worldConfig.startingSeason,
        date: makeDate(week),
        week,
        homeTeamId,
        awayTeamId,
        status: "scheduled",
      };
      gameCounter += 1;
    }
  }

  const standings: Record<string, LeagueStandings> = {
    [startingLeague.id]: {
      leagueId: startingLeague.id,
      lastUpdatedDate: worldConfig.startingDate,
      rows: startingTeams.map((t) => ({
        teamId: t.id,
        wins: 0,
        losses: 0,
        winPct: 0,
        runsFor: 0,
        runsAgainst: 0,
        runDifferential: 0,
        streak: 0,
        averageAttendance: 0,
      })),
    },
  };

  return {
    meta: {
      schemaVersion: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      gameVersion: "0.1.0",
      saveName: "New Franchise",
    },
    rng: { seed, step: 1 },
    world: {
      currentDate: worldConfig.startingDate,
      currentSeason: worldConfig.startingSeason,
      currentWeek: 1,
      currentPhase: "regularSeason",
      userTeamId,
      difficulty: "normal",
      currency: "USD",
    },
    leagues,
    teams,
    players,
    stadiums,
    schedule,
    standings,
    finances,
    mailbox: {
      unreadCount: 2,
      messages: [
        {
          id: "mail_001",
          date: worldConfig.startingDate,
          sender: "League Commissioner",
          subject: "Welcome to the Atlantic Regional League",
          body: "We look forward to seeing how the Harbor City Mariners perform this season.",
          isRead: false,
        },
        {
          id: "mail_002",
          date: worldConfig.startingDate,
          sender: "Sam Delgado",
          subject: "About the roster",
          body: "We need more pitching depth, but there's enough here to compete if we manage smart.",
          isRead: false,
        },
      ],
    },
    eventLog: [],
  };
}
