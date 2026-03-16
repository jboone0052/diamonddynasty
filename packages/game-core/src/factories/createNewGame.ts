import { economyConfig, worldConfig } from "@baseball-sim/config";
import { introStory, startingLeague, startingTeams } from "@baseball-sim/content";
import { createPlayer } from "./createPlayer";
import { Contract, GameState, LeagueStandings, PlayerPosition, ScheduledGame, Team } from "../types/gameState";


const FIXED_ROSTER_POSITIONS: ("SP" | "RP" | "C" | "1B" | "2B" | "3B" | "SS" | "LF" | "CF" | "RF" | "DH")[] = [
  "C",
  "1B",
  "2B",
  "3B",
  "SS",
  "LF",
  "CF",
  "RF",
  "DH",
  "SP",
  "SP",
  "SP",
  "SP",
  "SP",
  "RP",
  "RP",
  "RP",
  "RP",
];

const RESERVE_BLUEPRINTS: Array<{ primary: PlayerPosition; secondary: PlayerPosition[] }> = [
  { primary: "C", secondary: ["1B", "DH"] },
  { primary: "2B", secondary: ["1B", "3B", "SS"] },
  { primary: "CF", secondary: ["LF", "RF", "DH"] },
  { primary: "RP", secondary: ["SP"] },
];

const STARTING_FREE_AGENT_COUNT = 24;
const FREE_AGENT_POSITION_CYCLE: PlayerPosition[] = ["SP", "RP", "C", "1B", "2B", "3B", "SS", "LF", "CF", "RF", "DH"];

function addDays(date: string, days: number) {
  const next = new Date(`${date}T00:00:00Z`);
  next.setUTCDate(next.getUTCDate() + days);
  return next.toISOString().slice(0, 10);
}

function makeBreakdown() {
  return {
    ticketSales: 0,
    sponsorships: 0,
    merchandise: 0,
    playoffRevenue: 0,
    transferFees: 0,
    other: 0,
  };
}

function makeExpenseBreakdown() {
  return {
    payroll: 0,
    staff: 0,
    travel: 0,
    upkeep: 0,
    scouting: 0,
    marketing: 0,
    debtService: 0,
    other: 0,
  };
}

function generateRoundRobinWeeks(teamIds: string[]) {
  const rotation = [...teamIds];
  const rounds: Array<Array<[string, string]>> = [];

  for (let round = 0; round < teamIds.length - 1; round += 1) {
    const week: Array<[string, string]> = [];
    for (let i = 0; i < rotation.length / 2; i += 1) {
      const home = rotation[i];
      const away = rotation[rotation.length - 1 - i];
      week.push(round % 2 === 0 ? [home, away] : [away, home]);
    }
    rounds.push(week);
    const fixed = rotation[0];
    const rest = rotation.slice(1);
    rest.unshift(rest.pop()!);
    rotation.splice(0, rotation.length, fixed, ...rest);
  }

  const mirrored = rounds.map((week) => week.map(([home, away]) => [away, home] as [string, string]));
  return [...rounds, ...mirrored];
}

function buildTeam(base: (typeof startingTeams)[number], userTeamId: string, rosterIds: string[]): Team {
  return {
    id: base.id,
    name: base.name,
    nickname: base.nickname,
    city: base.city,
    marketSize: base.id === "team_capital_city" ? 72 : base.id === "team_bayport" ? 58 : 42,
    prestige: base.id === "team_capital_city" ? 65 : 30,
    fanInterest: base.id === userTeamId ? 32 : 42,
    morale: 55,
    cash: base.id === userTeamId ? 250000 : 320000,
    debt: base.id === userTeamId ? 80000 : 40000,
    stadiumId: `stadium_${base.id}`,
    leagueId: startingLeague.id,
    rosterPlayerIds: rosterIds,
    reservePlayerIds: rosterIds.slice(18),
    injuredPlayerIds: [],
    activeLineup: {
      battingOrderPlayerIds: rosterIds.slice(0, 9),
      defensiveAssignments: {
        P: rosterIds[9],
        C: rosterIds[0],
        "1B": rosterIds[1],
        "2B": rosterIds[2],
        "3B": rosterIds[3],
        SS: rosterIds[4],
        LF: rosterIds[5],
        CF: rosterIds[6],
        RF: rosterIds[7],
        DH: rosterIds[8],
      },
      designatedHitterPlayerId: rosterIds[8],
    },
    rotation: {
      starterPlayerIds: rosterIds.slice(9, 14),
      nextStarterIndex: 0,
    },
    bullpenPlayerIds: rosterIds.slice(14, 18),
    staffIds: [],
    strategyProfile: {
      aggressiveness: base.id === userTeamId ? 50 : 45,
      youthFocus: 48,
      spendingTolerance: base.id === "team_capital_city" ? 70 : 40,
      stealFrequency: 45,
      bullpenQuickHook: 55,
    },
    isHumanControlled: base.id === userTeamId,
  };
}

function createInitialSeed() {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.floor(Math.random() * 1_000_000).toString(36)}`;
}

export function createNewGame(seed = createInitialSeed()): GameState {
  const userTeamId = "team_harbor_city";
  const now = new Date().toISOString();

  const leagues: GameState["leagues"] = {
    [startingLeague.id]: {
      ...startingLeague,
      teamIds: startingTeams.map((team) => team.id),
      seasonLength: worldConfig.gamesPerTeam,
      playoffFormat: "none",
      promotionSpots: 2,
      relegationSpots: 0,
      minStadiumCapacityForPromotion: worldConfig.promotionCapacityThreshold,
      minAverageAttendanceForPromotion: worldConfig.promotionAttendanceThreshold,
      minCashReserveForPromotion: worldConfig.promotionCashReserve,
    },
  };

  const teams: GameState["teams"] = {};
  const players: GameState["players"] = {};
  const stadiums: GameState["stadiums"] = {};
  const finances: GameState["finances"] = {};
  const facilities: GameState["facilities"] = {};
  const scouting: GameState["scouting"] = {};
  const contracts: GameState["contracts"] = {};
  const staff: GameState["staff"] = {};

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

  let playerCounter = 1;

  for (const base of startingTeams) {
    const rosterIds: string[] = [];
    const usedFullNames = new Set<string>();
    for (let i = 0; i < worldConfig.rosterSize; i += 1) {
      const playerId = `player_${String(playerCounter).padStart(5, "0")}`;
      let stepOffset = playerCounter * 43;
      const reserveBlueprint = RESERVE_BLUEPRINTS[i - FIXED_ROSTER_POSITIONS.length];
      const forcedPrimaryPosition = FIXED_ROSTER_POSITIONS[i] ?? reserveBlueprint?.primary;
      let player = createPlayer(playerId, seed, stepOffset, base.id, forcedPrimaryPosition);

      while (usedFullNames.has(player.fullName)) {
        stepOffset += 1;
        player = createPlayer(playerId, seed, stepOffset, base.id, forcedPrimaryPosition);
      }

      if (reserveBlueprint) {
        player.secondaryPositions = reserveBlueprint.secondary;
      }

      usedFullNames.add(player.fullName);
      const salaryScaleFromOverall = Math.max(0.75, player.overall / 60);
      const annualSalary = Math.round(economyConfig.averagePayrollPerPlayerMonthly * 12 * salaryScaleFromOverall);
      const contractId = `contract_${playerId}`;
      contracts[contractId] = {
        id: contractId,
        playerId,
        teamId: base.id,
        annualSalary,
        yearsTotal: 1,
        yearsRemaining: 1,
        signedDate: worldConfig.startingDate,
        expirationSeason: worldConfig.startingSeason,
        bonusClauses: [],
        noTradeClause: false,
      } as Contract;
      player.contractId = contractId;
      players[playerId] = player;
      rosterIds.push(playerId);
      playerCounter += 1;
    }

    teams[base.id] = buildTeam(base, userTeamId, rosterIds);

    stadiums[`stadium_${base.id}`] = {
      id: `stadium_${base.id}`,
      name: `${base.city} Field`,
      city: base.city,
      capacity: stadiumCaps[base.id],
      condition: 55,
      fanExperience: 45,
      fieldQuality: 50,
      lightingQuality: 50,
      hasLuxuryBoxes: base.id === "team_capital_city",
    };

    finances[base.id] = {
      teamId: base.id,
      currentCash: teams[base.id].cash,
      currentDebt: teams[base.id].debt,
      payrollMonthly: rosterIds.reduce((total, playerId) => total + Math.round(contracts[players[playerId].contractId!].annualSalary / 12), 0),
      staffCostsMonthly: economyConfig.averageStaffCostsMonthly,
      facilityUpkeepMonthly: economyConfig.averageFacilityUpkeepMonthly,
      scoutingBudgetMonthly: economyConfig.averageScoutingBudgetMonthly,
      marketingBudgetMonthly: economyConfig.averageMarketingBudgetMonthly,
      ticketPrice: economyConfig.baseTicketPrice,
      merchandiseStrength: economyConfig.baseMerchandiseStrength,
      sponsorRevenueMonthly: economyConfig.baseSponsorRevenueMonthly,
      lastMonthRevenueBreakdown: makeBreakdown(),
      lastMonthExpenseBreakdown: makeExpenseBreakdown(),
      seasonRevenueBreakdown: makeBreakdown(),
      seasonExpenseBreakdown: makeExpenseBreakdown(),
    };

    facilities[base.id] = {
      teamId: base.id,
      trainingFacilityLevel: 1,
      medicalFacilityLevel: 1,
      scoutingOfficeLevel: 1,
      stadiumUpgradeLevel: 1,
      maintenanceBacklog: base.id === userTeamId ? 45 : 25,
    };

    scouting[base.id] = {
      teamId: base.id,
      scoutingAccuracy: 40,
      domesticCoverage: 35,
      internationalCoverage: 20,
      prospectBoard: [],
    };
  }

  const usedFreeAgentNames = new Set<string>();
  for (let i = 0; i < STARTING_FREE_AGENT_COUNT; i += 1) {
    const playerId = `player_${String(playerCounter).padStart(5, "0")}`;
    let stepOffset = playerCounter * 43;
    const forcedPrimaryPosition = FREE_AGENT_POSITION_CYCLE[i % FREE_AGENT_POSITION_CYCLE.length];
    let player = createPlayer(playerId, seed, stepOffset, undefined, forcedPrimaryPosition);

    while (usedFreeAgentNames.has(player.fullName)) {
      stepOffset += 1;
      player = createPlayer(playerId, seed, stepOffset, undefined, forcedPrimaryPosition);
    }

    usedFreeAgentNames.add(player.fullName);
    player.contractId = undefined;
    player.currentTeamId = undefined;
    player.status = "freeAgent";
    players[playerId] = player;
    playerCounter += 1;
  }

  const schedule: Record<string, ScheduledGame> = {};
  const weeks = generateRoundRobinWeeks(startingTeams.map((team) => team.id));
  let gameCounter = 1;

  weeks.forEach((pairings, index) => {
    const week = index + 1;
    pairings.forEach(([homeTeamId, awayTeamId]) => {
      const id = `game_${String(gameCounter).padStart(4, "0")}`;
      schedule[id] = {
        id,
        leagueId: startingLeague.id,
        season: worldConfig.startingSeason,
        date: addDays(worldConfig.startingDate, (week - 1) * 7),
        week,
        homeTeamId,
        awayTeamId,
        status: "scheduled",
        weather: "Clear",
      };
      gameCounter += 1;
    });
  });

  const standings: Record<string, LeagueStandings> = {
    [startingLeague.id]: {
      leagueId: startingLeague.id,
      lastUpdatedDate: worldConfig.startingDate,
      rows: startingTeams.map((team) => ({
        teamId: team.id,
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

  const objectiveId = "obj_first_promotion";

  return {
    meta: {
      schemaVersion: 2,
      createdAt: now,
      updatedAt: now,
      gameVersion: "0.2.0",
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
      weeksInSeason: weeks.length,
      seasonStatus: "inProgress",
    },
    leagues,
    teams,
    players,
    stadiums,
    staff,
    contracts,
    schedule,
    standings,
    finances,
    facilities,
    scouting,
    injuries: {},
    story: {
      introCompleted: false,
      currentChapter: "inheritance",
      unlockedCutsceneIds: ["cutscene_inheritance"],
      completedObjectiveIds: [],
      activeObjectiveIds: [objectiveId],
      objectives: {
        [objectiveId]: {
          id: objectiveId,
          title: "Earn Promotion",
          description: "Finish in the top two and meet league promotion requirements.",
          category: "competitive",
          targetValue: 1,
          currentValue: 0,
          completed: false,
          reward: { prestige: 5, fanInterest: 8 },
        },
      },
    },
    mailbox: {
      unreadCount: 3,
      messages: [
        {
          id: "mail_001",
          date: worldConfig.startingDate,
          sender: "Club Archive",
          subject: introStory.title,
          body: introStory.body,
          category: "story",
          isRead: false,
        },
        {
          id: "mail_002",
          date: worldConfig.startingDate,
          sender: "League Commissioner",
          subject: "Welcome to the Atlantic Regional League",
          body: "You will need a top-two finish, strong attendance, and enough cash to claim promotion.",
          category: "league",
          isRead: false,
        },
        {
          id: "mail_003",
          date: worldConfig.startingDate,
          sender: "Sam Delgado",
          subject: "First week priorities",
          body: "Set the lineup, review the rotation, and keep ticket prices sensible so the crowd shows up.",
          category: "staff",
          isRead: false,
        },
      ],
    },
    eventLog: [
      {
        id: "event_001",
        timestamp: now,
        actionType: "CREATE_NEW_GAME",
        actorTeamId: userTeamId,
        payload: { userTeamId },
        summary: "Created a new franchise save.",
      },
    ],
    pendingActions: [],
  };
}


