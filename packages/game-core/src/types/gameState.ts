export type SaveMeta = {
  schemaVersion: number;
  createdAt: string;
  updatedAt: string;
  gameVersion: string;
  saveName: string;
};

export type RngState = {
  seed: string;
  step: number;
};

export type WorldPhase = "preseason" | "regularSeason" | "playoffs" | "offseason";

export type WorldState = {
  currentDate: string;
  currentSeason: number;
  currentWeek: number;
  currentPhase: WorldPhase;
  userTeamId: string;
  difficulty: "easy" | "normal" | "hard" | "sim";
  currency: string;
};

export type HittingRatings = {
  contact: number;
  power: number;
  plateDiscipline: number;
  clutch: number;
};

export type DefenseRatings = {
  fielding: number;
  range: number;
  arm: number;
};

export type SpeedRatings = {
  speed: number;
  stealing: number;
  baserunningIQ: number;
};

export type PitchingRatings = {
  velocity: number;
  control: number;
  movement: number;
  stamina: number;
  holdRunners: number;
};

export type PlayerRatings = {
  hitting: HittingRatings;
  defense: DefenseRatings;
  speed: SpeedRatings;
  pitching?: PitchingRatings;
};

export type PersonalityProfile = {
  loyalty: number;
  greed: number;
  leadership: number;
  workEthic: number;
  competitiveness: number;
  consistency: number;
};

export type Player = {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  age: number;
  primaryPosition: "SP" | "RP" | "C" | "1B" | "2B" | "3B" | "SS" | "LF" | "CF" | "RF" | "DH";
  overall: number;
  potential: number;
  morale: number;
  fatigue: number;
  ratings: PlayerRatings;
  personality: PersonalityProfile;
  currentTeamId?: string;
  status: "active" | "reserve" | "injured" | "freeAgent" | "retired";
  seasonStats: {
    games: number;
    hits: number;
    homeRuns: number;
    runsBattedIn: number;
    inningsPitched: number;
    strikeoutsPitched: number;
  };
};

export type TeamLineup = {
  battingOrderPlayerIds: string[];
  defensiveAssignments: Record<string, string>;
};

export type PitchingRotation = {
  starterPlayerIds: string[];
  nextStarterIndex: number;
};

export type Team = {
  id: string;
  name: string;
  nickname: string;
  city: string;
  marketSize: number;
  prestige: number;
  fanInterest: number;
  morale: number;
  cash: number;
  debt: number;
  stadiumId: string;
  leagueId: string;
  rosterPlayerIds: string[];
  activeLineup: TeamLineup;
  rotation: PitchingRotation;
  bullpenPlayerIds: string[];
  isHumanControlled: boolean;
};

export type Stadium = {
  id: string;
  name: string;
  city: string;
  capacity: number;
  condition: number;
  fanExperience: number;
  fieldQuality: number;
  lightingQuality: number;
};

export type League = {
  id: string;
  name: string;
  shortName: string;
  tier: number;
  region: string;
  teamIds: string[];
  seasonLength: number;
  promotionSpots: number;
  relegationSpots: number;
  minStadiumCapacityForPromotion: number;
  minAverageAttendanceForPromotion: number;
  minCashReserveForPromotion: number;
};

export type ScheduledGame = {
  id: string;
  leagueId: string;
  season: number;
  date: string;
  week: number;
  homeTeamId: string;
  awayTeamId: string;
  status: "scheduled" | "completed";
  result?: GameResult;
};

export type GameResult = {
  homeScore: number;
  awayScore: number;
  winningTeamId: string;
  losingTeamId: string;
  attendance: number;
};

export type StandingsRow = {
  teamId: string;
  wins: number;
  losses: number;
  winPct: number;
  runsFor: number;
  runsAgainst: number;
  runDifferential: number;
  streak: number;
  averageAttendance: number;
};

export type LeagueStandings = {
  leagueId: string;
  rows: StandingsRow[];
  lastUpdatedDate: string;
};

export type TeamFinanceState = {
  teamId: string;
  currentCash: number;
  currentDebt: number;
  payrollMonthly: number;
  sponsorRevenueMonthly: number;
  ticketPrice: number;
};

export type MailMessage = {
  id: string;
  date: string;
  sender: string;
  subject: string;
  body: string;
  isRead: boolean;
};

export type GameState = {
  meta: SaveMeta;
  rng: RngState;
  world: WorldState;
  leagues: Record<string, League>;
  teams: Record<string, Team>;
  players: Record<string, Player>;
  stadiums: Record<string, Stadium>;
  schedule: Record<string, ScheduledGame>;
  standings: Record<string, LeagueStandings>;
  finances: Record<string, TeamFinanceState>;
  mailbox: {
    messages: MailMessage[];
    unreadCount: number;
  };
  eventLog: Array<{
    id: string;
    timestamp: string;
    actionType: string;
    payload: Record<string, unknown>;
    summary: string;
  }>;
};
