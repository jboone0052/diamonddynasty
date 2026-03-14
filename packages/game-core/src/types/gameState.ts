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
export type DifficultyLevel = "easy" | "normal" | "hard" | "sim";
export type Handedness = "L" | "R" | "S";
export type PlayerPosition = "SP" | "RP" | "C" | "1B" | "2B" | "3B" | "SS" | "LF" | "CF" | "RF" | "DH";
export type FieldPosition = "P" | "C" | "1B" | "2B" | "3B" | "SS" | "LF" | "CF" | "RF" | "DH";
export type PlayerStatus = "active" | "reserve" | "injured" | "freeAgent" | "retired" | "suspended";
export type StaffRole = "manager" | "hittingCoach" | "pitchingCoach" | "trainer" | "scout" | "generalManager";
export type GameStatus = "scheduled" | "inProgress" | "completed" | "postponed" | "cancelled";
export type InjurySeverity = "minor" | "moderate" | "major";
export type StoryChapter = "inheritance" | "rebuild" | "firstPromotionPush" | "nextTierArrival" | "dynasty";
export type MailCategory = "news" | "injury" | "sponsorship" | "story" | "league" | "staff";
export type PendingActionType = "SET_LINEUP" | "SET_ROTATION" | "SET_TICKET_PRICE" | "MARK_MESSAGE_READ" | "ADVANCE_WEEK";
export type PendingActionStatus = "queued" | "processed" | "failed";

export type WorldState = {
  currentDate: string;
  currentSeason: number;
  currentWeek: number;
  currentPhase: WorldPhase;
  userTeamId: string;
  difficulty: DifficultyLevel;
  currency: string;
  weeksInSeason: number;
  seasonStatus: "inProgress" | "completed";
};

export type TeamStrategyProfile = {
  aggressiveness: number;
  youthFocus: number;
  spendingTolerance: number;
  stealFrequency: number;
  bullpenQuickHook: number;
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
  catcherFraming?: number;
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

export type DevelopmentProfile = {
  growthRate: number;
  declineRate: number;
  peakAgeStart: number;
  peakAgeEnd: number;
  lastWeeklyDevelopmentTick?: string;
};

export type BattingLine = {
  playerId: string;
  atBats: number;
  runs: number;
  hits: number;
  rbi: number;
  walks: number;
  strikeouts: number;
  doubles: number;
  triples: number;
  homeRuns: number;
  stolenBases: number;
};

export type PitchingLine = {
  playerId: string;
  inningsPitched: number;
  hitsAllowed: number;
  earnedRuns: number;
  walks: number;
  strikeouts: number;
  homeRunsAllowed: number;
  pitchesThrown: number;
};

export type PlayerSeasonStats = {
  games: number;
  atBats: number;
  runs: number;
  hits: number;
  runsBattedIn: number;
  walks: number;
  strikeouts: number;
  doubles: number;
  triples: number;
  homeRuns: number;
  battingAverage: number;
  stolenBases: number;
  inningsPitched: number;
  wins: number;
  losses: number;
  saves: number;
  hitsAllowed: number;
  earnedRuns: number;
  walksAllowed: number;
  strikeoutsPitched: number;
  homeRunsAllowed: number;
};

export type PlayerCareerStats = PlayerSeasonStats;

export type Player = {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  age: number;
  bats: Handedness;
  throws: Handedness;
  nationality: string;
  primaryPosition: PlayerPosition;
  secondaryPositions: PlayerPosition[];
  overall: number;
  potential: number;
  morale: number;
  fatigue: number;
  injuryProneness: number;
  ratings: PlayerRatings;
  personality: PersonalityProfile;
  development: DevelopmentProfile;
  contractId?: string;
  currentTeamId?: string;
  serviceTimeDays: number;
  isRetiringAfterSeason: boolean;
  status: PlayerStatus;
  seasonStats: PlayerSeasonStats;
  careerStats: PlayerCareerStats;
};

export type TeamLineup = {
  battingOrderPlayerIds: string[];
  defensiveAssignments: Record<FieldPosition, string>;
  designatedHitterPlayerId?: string;
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
  reservePlayerIds: string[];
  injuredPlayerIds: string[];
  activeLineup: TeamLineup;
  rotation: PitchingRotation;
  bullpenPlayerIds: string[];
  staffIds: string[];
  strategyProfile: TeamStrategyProfile;
  isHumanControlled: boolean;
};

export type PlayoffFormat = "none" | "top2Final" | "top4Bracket";

export type League = {
  id: string;
  name: string;
  shortName: string;
  tier: number;
  region: string;
  teamIds: string[];
  seasonLength: number;
  playoffFormat: PlayoffFormat;
  promotionSpots: number;
  relegationSpots: number;
  minStadiumCapacityForPromotion: number;
  minAverageAttendanceForPromotion: number;
  minCashReserveForPromotion: number;
};

export type ContractBonusClause = {
  type: "gamesPlayed" | "allStar" | "promotionAchieved" | "awardWon";
  amount: number;
};

export type Contract = {
  id: string;
  playerId: string;
  teamId: string;
  annualSalary: number;
  yearsTotal: number;
  yearsRemaining: number;
  signedDate: string;
  expirationSeason: number;
  bonusClauses: ContractBonusClause[];
  noTradeClause: boolean;
};

export type StaffSkillRatings = {
  playerDevelopment: number;
  injuryPrevention: number;
  scoutingAccuracy: number;
  moraleManagement: number;
  tactics: number;
};

export type StaffMember = {
  id: string;
  fullName: string;
  role: StaffRole;
  skillRatings: StaffSkillRatings;
  salary: number;
  contractYearsRemaining: number;
  currentTeamId?: string;
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
  hasLuxuryBoxes: boolean;
};

export type FacilityState = {
  teamId: string;
  trainingFacilityLevel: number;
  medicalFacilityLevel: number;
  scoutingOfficeLevel: number;
  stadiumUpgradeLevel: number;
  maintenanceBacklog: number;
};

export type ProspectReport = {
  playerId: string;
  scoutedOverallEstimate: number;
  scoutedPotentialEstimate: number;
  confidence: number;
  notes: string[];
  lastScoutedDate: string;
};

export type ScoutingDepartment = {
  teamId: string;
  scoutingAccuracy: number;
  domesticCoverage: number;
  internationalCoverage: number;
  prospectBoard: ProspectReport[];
};

export type InjuryRecord = {
  id: string;
  playerId: string;
  injuryType: string;
  severity: InjurySeverity;
  startDate: string;
  expectedReturnDate: string;
  gamesRemainingEstimate: number;
  isActive: boolean;
};

export type RevenueBreakdown = {
  ticketSales: number;
  sponsorships: number;
  merchandise: number;
  playoffRevenue: number;
  transferFees: number;
  other: number;
};

export type ExpenseBreakdown = {
  payroll: number;
  staff: number;
  travel: number;
  upkeep: number;
  scouting: number;
  marketing: number;
  debtService: number;
  other: number;
};

export type TeamFinanceState = {
  teamId: string;
  currentCash: number;
  currentDebt: number;
  payrollMonthly: number;
  staffCostsMonthly: number;
  facilityUpkeepMonthly: number;
  scoutingBudgetMonthly: number;
  marketingBudgetMonthly: number;
  ticketPrice: number;
  merchandiseStrength: number;
  sponsorRevenueMonthly: number;
  lastMonthRevenueBreakdown: RevenueBreakdown;
  lastMonthExpenseBreakdown: ExpenseBreakdown;
};

export type SimSummary = {
  randomSeedUsed: string;
  totalPlateAppearances: number;
  totalHits: number;
  totalWalks: number;
  totalStrikeouts: number;
  runnerAdvancementEvents: number;
  injuryEvents: number;
};

export type BoxScore = {
  battingLines: Record<string, BattingLine>;
  pitchingLines: Record<string, PitchingLine>;
  errorsByTeam: Record<string, number>;
};

export type GameResult = {
  homeScore: number;
  awayScore: number;
  inningsPlayed: number;
  winningTeamId: string;
  losingTeamId: string;
  savePitcherId?: string;
  winningPitcherId?: string;
  losingPitcherId?: string;
  attendance: number;
  notableEvents: string[];
  playByPlay?: string[];
  boxScore: BoxScore;
  simSummary: SimSummary;
};

export type ScheduledGame = {
  id: string;
  leagueId: string;
  season: number;
  date: string;
  week: number;
  homeTeamId: string;
  awayTeamId: string;
  status: GameStatus;
  result?: GameResult;
  weather?: string;
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

export type ObjectiveReward = {
  cash?: number;
  prestige?: number;
  fanInterest?: number;
};

export type Objective = {
  id: string;
  title: string;
  description: string;
  category: "financial" | "competitive" | "attendance" | "facility" | "story";
  targetValue?: number;
  currentValue?: number;
  completed: boolean;
  reward?: ObjectiveReward;
};

export type StoryState = {
  introCompleted: boolean;
  currentChapter: StoryChapter;
  unlockedCutsceneIds: string[];
  completedObjectiveIds: string[];
  activeObjectiveIds: string[];
  objectives: Record<string, Objective>;
  seasonResultMessage?: string;
};

export type MailMessage = {
  id: string;
  date: string;
  sender: string;
  subject: string;
  body: string;
  category: MailCategory;
  isRead: boolean;
  relatedEntityId?: string;
};

export type MailboxState = {
  messages: MailMessage[];
  unreadCount: number;
};

export type EventLogEntry = {
  id: string;
  timestamp: string;
  actionType: string;
  actorTeamId?: string;
  actorPlayerId?: string;
  payload: Record<string, unknown>;
  summary: string;
};

export type PendingAction = {
  id: string;
  type: PendingActionType;
  createdAt: string;
  payload: Record<string, unknown>;
  status: PendingActionStatus;
};

export type PromotionStatus = {
  finalRank: number;
  qualifiedByRank: boolean;
  stadiumRequirementMet: boolean;
  attendanceRequirementMet: boolean;
  cashRequirementMet: boolean;
  promoted: boolean;
  summary: string;
};

export type SeasonSummary = {
  championTeamId: string;
  finalStandings: string[];
  promotion: PromotionStatus;
  message: string;
};

export type GameState = {
  meta: SaveMeta;
  rng: RngState;
  world: WorldState;
  leagues: Record<string, League>;
  teams: Record<string, Team>;
  players: Record<string, Player>;
  stadiums: Record<string, Stadium>;
  staff: Record<string, StaffMember>;
  contracts: Record<string, Contract>;
  schedule: Record<string, ScheduledGame>;
  standings: Record<string, LeagueStandings>;
  finances: Record<string, TeamFinanceState>;
  facilities: Record<string, FacilityState>;
  scouting: Record<string, ScoutingDepartment>;
  injuries: Record<string, InjuryRecord>;
  story: StoryState;
  mailbox: MailboxState;
  eventLog: EventLogEntry[];
  pendingActions: PendingAction[];
  seasonSummary?: SeasonSummary;
};
