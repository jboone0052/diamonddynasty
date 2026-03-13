import { z } from "zod";

const isoDateSchema = z.string().min(10);
const isoTimestampSchema = z.string().min(10);
const ratingSchema = z.number().int().min(0).max(100);

export const SaveMetaSchema = z.object({
  schemaVersion: z.number().int().min(1),
  createdAt: isoTimestampSchema,
  updatedAt: isoTimestampSchema,
  gameVersion: z.string(),
  saveName: z.string(),
});

export const RngStateSchema = z.object({
  seed: z.string(),
  step: z.number().int().min(0),
});

export const WorldStateSchema = z.object({
  currentDate: isoDateSchema,
  currentSeason: z.number().int(),
  currentWeek: z.number().int().min(1),
  currentPhase: z.enum(["preseason", "regularSeason", "playoffs", "offseason"]),
  userTeamId: z.string(),
  difficulty: z.enum(["easy", "normal", "hard", "sim"]),
  currency: z.string(),
  weeksInSeason: z.number().int().min(1),
  seasonStatus: z.enum(["inProgress", "completed"]),
});

export const TeamStrategyProfileSchema = z.object({
  aggressiveness: ratingSchema,
  youthFocus: ratingSchema,
  spendingTolerance: ratingSchema,
  stealFrequency: ratingSchema,
  bullpenQuickHook: ratingSchema,
});

export const HittingRatingsSchema = z.object({
  contact: ratingSchema,
  power: ratingSchema,
  plateDiscipline: ratingSchema,
  clutch: ratingSchema,
});

export const DefenseRatingsSchema = z.object({
  fielding: ratingSchema,
  range: ratingSchema,
  arm: ratingSchema,
  catcherFraming: ratingSchema.optional(),
});

export const SpeedRatingsSchema = z.object({
  speed: ratingSchema,
  stealing: ratingSchema,
  baserunningIQ: ratingSchema,
});

export const PitchingRatingsSchema = z.object({
  velocity: ratingSchema,
  control: ratingSchema,
  movement: ratingSchema,
  stamina: ratingSchema,
  holdRunners: ratingSchema,
});

export const PlayerRatingsSchema = z.object({
  hitting: HittingRatingsSchema,
  defense: DefenseRatingsSchema,
  speed: SpeedRatingsSchema,
  pitching: PitchingRatingsSchema.optional(),
});

export const PersonalityProfileSchema = z.object({
  loyalty: ratingSchema,
  greed: ratingSchema,
  leadership: ratingSchema,
  workEthic: ratingSchema,
  competitiveness: ratingSchema,
  consistency: ratingSchema,
});

export const DevelopmentProfileSchema = z.object({
  growthRate: z.number(),
  declineRate: z.number(),
  peakAgeStart: z.number().int(),
  peakAgeEnd: z.number().int(),
  lastWeeklyDevelopmentTick: isoDateSchema.optional(),
});

export const BattingLineSchema = z.object({
  playerId: z.string(),
  atBats: z.number().int().min(0),
  runs: z.number().int().min(0),
  hits: z.number().int().min(0),
  rbi: z.number().int().min(0),
  walks: z.number().int().min(0),
  strikeouts: z.number().int().min(0),
  doubles: z.number().int().min(0),
  triples: z.number().int().min(0),
  homeRuns: z.number().int().min(0),
  stolenBases: z.number().int().min(0),
});

export const PitchingLineSchema = z.object({
  playerId: z.string(),
  inningsPitched: z.number().min(0),
  hitsAllowed: z.number().int().min(0),
  earnedRuns: z.number().int().min(0),
  walks: z.number().int().min(0),
  strikeouts: z.number().int().min(0),
  homeRunsAllowed: z.number().int().min(0),
  pitchesThrown: z.number().int().min(0),
});

export const PlayerSeasonStatsSchema = z.object({
  games: z.number().int().min(0),
  atBats: z.number().int().min(0),
  runs: z.number().int().min(0),
  hits: z.number().int().min(0),
  runsBattedIn: z.number().int().min(0),
  walks: z.number().int().min(0),
  strikeouts: z.number().int().min(0),
  doubles: z.number().int().min(0),
  triples: z.number().int().min(0),
  homeRuns: z.number().int().min(0),
  stolenBases: z.number().int().min(0),
  inningsPitched: z.number().min(0),
  wins: z.number().int().min(0),
  losses: z.number().int().min(0),
  saves: z.number().int().min(0),
  hitsAllowed: z.number().int().min(0),
  earnedRuns: z.number().int().min(0),
  walksAllowed: z.number().int().min(0),
  strikeoutsPitched: z.number().int().min(0),
  homeRunsAllowed: z.number().int().min(0),
});

export const PlayerSchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  fullName: z.string(),
  age: z.number().int().min(16),
  bats: z.enum(["L", "R", "S"]),
  throws: z.enum(["L", "R", "S"]),
  nationality: z.string(),
  primaryPosition: z.enum(["SP", "RP", "C", "1B", "2B", "3B", "SS", "LF", "CF", "RF", "DH"]),
  secondaryPositions: z.array(z.enum(["SP", "RP", "C", "1B", "2B", "3B", "SS", "LF", "CF", "RF", "DH"])),
  overall: ratingSchema,
  potential: ratingSchema,
  morale: ratingSchema,
  fatigue: ratingSchema,
  injuryProneness: ratingSchema,
  ratings: PlayerRatingsSchema,
  personality: PersonalityProfileSchema,
  development: DevelopmentProfileSchema,
  contractId: z.string().optional(),
  currentTeamId: z.string().optional(),
  serviceTimeDays: z.number().int().min(0),
  isRetiringAfterSeason: z.boolean(),
  status: z.enum(["active", "reserve", "injured", "freeAgent", "retired", "suspended"]),
  seasonStats: PlayerSeasonStatsSchema,
  careerStats: PlayerSeasonStatsSchema,
});

export const TeamLineupSchema = z.object({
  battingOrderPlayerIds: z.array(z.string()).length(9),
  defensiveAssignments: z.record(z.string()),
  designatedHitterPlayerId: z.string().optional(),
});

export const PitchingRotationSchema = z.object({
  starterPlayerIds: z.array(z.string()).min(3),
  nextStarterIndex: z.number().int().min(0),
});

export const TeamSchema = z.object({
  id: z.string(),
  name: z.string(),
  nickname: z.string(),
  city: z.string(),
  marketSize: ratingSchema,
  prestige: ratingSchema,
  fanInterest: ratingSchema,
  morale: ratingSchema,
  cash: z.number().int(),
  debt: z.number().int(),
  stadiumId: z.string(),
  leagueId: z.string(),
  rosterPlayerIds: z.array(z.string()),
  reservePlayerIds: z.array(z.string()),
  injuredPlayerIds: z.array(z.string()),
  activeLineup: TeamLineupSchema,
  rotation: PitchingRotationSchema,
  bullpenPlayerIds: z.array(z.string()),
  staffIds: z.array(z.string()),
  strategyProfile: TeamStrategyProfileSchema,
  isHumanControlled: z.boolean(),
});

export const LeagueSchema = z.object({
  id: z.string(),
  name: z.string(),
  shortName: z.string(),
  tier: z.number().int().min(1),
  region: z.string(),
  teamIds: z.array(z.string()),
  seasonLength: z.number().int().min(1),
  playoffFormat: z.enum(["none", "top2Final", "top4Bracket"]),
  promotionSpots: z.number().int().min(0),
  relegationSpots: z.number().int().min(0),
  minStadiumCapacityForPromotion: z.number().int().min(0),
  minAverageAttendanceForPromotion: z.number().int().min(0),
  minCashReserveForPromotion: z.number().int(),
});

export const ContractSchema = z.object({
  id: z.string(),
  playerId: z.string(),
  teamId: z.string(),
  annualSalary: z.number().int().min(0),
  yearsTotal: z.number().int().min(1),
  yearsRemaining: z.number().int().min(0),
  signedDate: isoDateSchema,
  expirationSeason: z.number().int(),
  bonusClauses: z.array(z.object({ type: z.enum(["gamesPlayed", "allStar", "promotionAchieved", "awardWon"]), amount: z.number().int().min(0) })),
  noTradeClause: z.boolean(),
});

export const StaffMemberSchema = z.object({
  id: z.string(),
  fullName: z.string(),
  role: z.enum(["manager", "hittingCoach", "pitchingCoach", "trainer", "scout", "generalManager"]),
  skillRatings: z.object({
    playerDevelopment: ratingSchema,
    injuryPrevention: ratingSchema,
    scoutingAccuracy: ratingSchema,
    moraleManagement: ratingSchema,
    tactics: ratingSchema,
  }),
  salary: z.number().int().min(0),
  contractYearsRemaining: z.number().int().min(0),
  currentTeamId: z.string().optional(),
});

export const StadiumSchema = z.object({
  id: z.string(),
  name: z.string(),
  city: z.string(),
  capacity: z.number().int().min(0),
  condition: ratingSchema,
  fanExperience: ratingSchema,
  fieldQuality: ratingSchema,
  lightingQuality: ratingSchema,
  hasLuxuryBoxes: z.boolean(),
});

export const FacilityStateSchema = z.object({
  teamId: z.string(),
  trainingFacilityLevel: z.number().int().min(1),
  medicalFacilityLevel: z.number().int().min(1),
  scoutingOfficeLevel: z.number().int().min(1),
  stadiumUpgradeLevel: z.number().int().min(1),
  maintenanceBacklog: ratingSchema,
});

export const ScoutingDepartmentSchema = z.object({
  teamId: z.string(),
  scoutingAccuracy: ratingSchema,
  domesticCoverage: ratingSchema,
  internationalCoverage: ratingSchema,
  prospectBoard: z.array(z.object({
    playerId: z.string(),
    scoutedOverallEstimate: ratingSchema,
    scoutedPotentialEstimate: ratingSchema,
    confidence: ratingSchema,
    notes: z.array(z.string()),
    lastScoutedDate: isoDateSchema,
  })),
});

export const InjuryRecordSchema = z.object({
  id: z.string(),
  playerId: z.string(),
  injuryType: z.string(),
  severity: z.enum(["minor", "moderate", "major"]),
  startDate: isoDateSchema,
  expectedReturnDate: isoDateSchema,
  gamesRemainingEstimate: z.number().int().min(0),
  isActive: z.boolean(),
});

export const RevenueBreakdownSchema = z.object({
  ticketSales: z.number().int(),
  sponsorships: z.number().int(),
  merchandise: z.number().int(),
  playoffRevenue: z.number().int(),
  transferFees: z.number().int(),
  other: z.number().int(),
});

export const ExpenseBreakdownSchema = z.object({
  payroll: z.number().int(),
  staff: z.number().int(),
  travel: z.number().int(),
  upkeep: z.number().int(),
  scouting: z.number().int(),
  marketing: z.number().int(),
  debtService: z.number().int(),
  other: z.number().int(),
});

export const TeamFinanceStateSchema = z.object({
  teamId: z.string(),
  currentCash: z.number().int(),
  currentDebt: z.number().int(),
  payrollMonthly: z.number().int(),
  staffCostsMonthly: z.number().int(),
  facilityUpkeepMonthly: z.number().int(),
  scoutingBudgetMonthly: z.number().int(),
  marketingBudgetMonthly: z.number().int(),
  ticketPrice: z.number().int().min(1),
  merchandiseStrength: ratingSchema,
  sponsorRevenueMonthly: z.number().int().min(0),
  lastMonthRevenueBreakdown: RevenueBreakdownSchema,
  lastMonthExpenseBreakdown: ExpenseBreakdownSchema,
});

export const SimSummarySchema = z.object({
  randomSeedUsed: z.string(),
  totalPlateAppearances: z.number().int().min(0),
  totalHits: z.number().int().min(0),
  totalWalks: z.number().int().min(0),
  totalStrikeouts: z.number().int().min(0),
  runnerAdvancementEvents: z.number().int().min(0),
  injuryEvents: z.number().int().min(0),
});

export const BoxScoreSchema = z.object({
  battingLines: z.record(BattingLineSchema),
  pitchingLines: z.record(PitchingLineSchema),
  errorsByTeam: z.record(z.number().int().min(0)),
});

export const GameResultSchema = z.object({
  homeScore: z.number().int().min(0),
  awayScore: z.number().int().min(0),
  inningsPlayed: z.number().int().min(9),
  winningTeamId: z.string(),
  losingTeamId: z.string(),
  savePitcherId: z.string().optional(),
  winningPitcherId: z.string().optional(),
  losingPitcherId: z.string().optional(),
  attendance: z.number().int().min(0),
  notableEvents: z.array(z.string()),
  boxScore: BoxScoreSchema,
  simSummary: SimSummarySchema,
});

export const ScheduledGameSchema = z.object({
  id: z.string(),
  leagueId: z.string(),
  season: z.number().int(),
  date: isoDateSchema,
  week: z.number().int().min(1),
  homeTeamId: z.string(),
  awayTeamId: z.string(),
  status: z.enum(["scheduled", "inProgress", "completed", "postponed", "cancelled"]),
  result: GameResultSchema.optional(),
  weather: z.string().optional(),
});

export const StandingsRowSchema = z.object({
  teamId: z.string(),
  wins: z.number().int().min(0),
  losses: z.number().int().min(0),
  winPct: z.number().min(0),
  runsFor: z.number().int().min(0),
  runsAgainst: z.number().int().min(0),
  runDifferential: z.number().int(),
  streak: z.number().int(),
  averageAttendance: z.number().int().min(0),
});

export const LeagueStandingsSchema = z.object({
  leagueId: z.string(),
  rows: z.array(StandingsRowSchema),
  lastUpdatedDate: isoDateSchema,
});

export const ObjectiveSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  category: z.enum(["financial", "competitive", "attendance", "facility", "story"]),
  targetValue: z.number().optional(),
  currentValue: z.number().optional(),
  completed: z.boolean(),
  reward: z.object({
    cash: z.number().optional(),
    prestige: z.number().optional(),
    fanInterest: z.number().optional(),
  }).optional(),
});

export const StoryStateSchema = z.object({
  introCompleted: z.boolean(),
  currentChapter: z.enum(["inheritance", "rebuild", "firstPromotionPush", "nextTierArrival", "dynasty"]),
  unlockedCutsceneIds: z.array(z.string()),
  completedObjectiveIds: z.array(z.string()),
  activeObjectiveIds: z.array(z.string()),
  objectives: z.record(ObjectiveSchema),
  seasonResultMessage: z.string().optional(),
});

export const MailMessageSchema = z.object({
  id: z.string(),
  date: isoDateSchema,
  sender: z.string(),
  subject: z.string(),
  body: z.string(),
  category: z.enum(["news", "injury", "sponsorship", "story", "league", "staff"]),
  isRead: z.boolean(),
  relatedEntityId: z.string().optional(),
});

export const MailboxStateSchema = z.object({
  messages: z.array(MailMessageSchema),
  unreadCount: z.number().int().min(0),
});

export const EventLogEntrySchema = z.object({
  id: z.string(),
  timestamp: isoTimestampSchema,
  actionType: z.string(),
  actorTeamId: z.string().optional(),
  actorPlayerId: z.string().optional(),
  payload: z.record(z.unknown()),
  summary: z.string(),
});

export const PendingActionSchema = z.object({
  id: z.string(),
  type: z.enum(["SET_LINEUP", "SET_ROTATION", "SET_TICKET_PRICE", "MARK_MESSAGE_READ", "ADVANCE_WEEK"]),
  createdAt: isoTimestampSchema,
  payload: z.record(z.unknown()),
  status: z.enum(["queued", "processed", "failed"]),
});

export const PromotionStatusSchema = z.object({
  finalRank: z.number().int().min(1),
  qualifiedByRank: z.boolean(),
  stadiumRequirementMet: z.boolean(),
  attendanceRequirementMet: z.boolean(),
  cashRequirementMet: z.boolean(),
  promoted: z.boolean(),
  summary: z.string(),
});

export const SeasonSummarySchema = z.object({
  championTeamId: z.string(),
  finalStandings: z.array(z.string()),
  promotion: PromotionStatusSchema,
  message: z.string(),
});

export const GameStateSchema = z.object({
  meta: SaveMetaSchema,
  rng: RngStateSchema,
  world: WorldStateSchema,
  leagues: z.record(LeagueSchema),
  teams: z.record(TeamSchema),
  players: z.record(PlayerSchema),
  stadiums: z.record(StadiumSchema),
  staff: z.record(StaffMemberSchema),
  contracts: z.record(ContractSchema),
  schedule: z.record(ScheduledGameSchema),
  standings: z.record(LeagueStandingsSchema),
  finances: z.record(TeamFinanceStateSchema),
  facilities: z.record(FacilityStateSchema),
  scouting: z.record(ScoutingDepartmentSchema),
  injuries: z.record(InjuryRecordSchema),
  story: StoryStateSchema,
  mailbox: MailboxStateSchema,
  eventLog: z.array(EventLogEntrySchema),
  pendingActions: z.array(PendingActionSchema),
  seasonSummary: SeasonSummarySchema.optional(),
});
