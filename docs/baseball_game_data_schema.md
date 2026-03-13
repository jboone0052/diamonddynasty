
# Baseball Franchise Simulator — Game Data Schema & Entity Model

## Purpose
This document defines the core data structures for the baseball franchise simulator.

It is intended to serve as the blueprint for:

- save file design
- local persistence
- future cloud persistence
- simulation engine inputs and outputs
- API contracts for future multiplayer
- analytics and debugging tools

The schema is designed to be:

- serializable
- versioned
- deterministic
- cross-platform
- backend-ready

---

# Schema Design Principles

## 1. Stable IDs
Every major entity must have a stable unique ID.

Examples:
- playerId
- teamId
- leagueId
- stadiumId
- contractId
- gameId
- eventId

IDs should never depend on array position.

Recommended format:

```ts
type EntityId = string;
```

Examples:
- `player_001284`
- `team_harbor_city`
- `game_rl_2027_04_12_001`

---

## 2. Versioned Save Files
All saved games must include a schema version.

```ts
interface SaveMeta {
  schemaVersion: number;
  createdAt: string;
  updatedAt: string;
  gameVersion: string;
}
```

This allows migration logic when the game evolves.

---

## 3. Normalized Core Data
To avoid duplication and make multiplayer easier later, entities should be primarily normalized.

Example:
- a Team stores player IDs, not full player objects
- a League stores team IDs
- a Schedule stores game IDs

---

# Top-Level GameState

```ts
interface GameState {
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
}
```

---

# SaveMeta

```ts
interface SaveMeta {
  schemaVersion: number;
  createdAt: string;   // ISO timestamp
  updatedAt: string;   // ISO timestamp
  gameVersion: string;
  saveName: string;
}
```

---

# RNG State

To support deterministic simulation and future server-authoritative multiplayer:

```ts
interface RngState {
  seed: string;
  step: number;
}
```

---

# WorldState

```ts
interface WorldState {
  currentDate: string;          // YYYY-MM-DD
  currentSeason: number;
  currentWeek: number;
  currentPhase: WorldPhase;
  userTeamId: string;
  difficulty: DifficultyLevel;
  currency: string;
}
```

```ts
type WorldPhase =
  | "preseason"
  | "regularSeason"
  | "playoffs"
  | "offseason";

type DifficultyLevel =
  | "easy"
  | "normal"
  | "hard"
  | "sim";
```

---

# League Entity

```ts
interface League {
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
}
```

```ts
type PlayoffFormat =
  | "none"
  | "top2Final"
  | "top4Bracket";
```

---

# Team Entity

```ts
interface Team {
  id: string;
  name: string;
  nickname: string;
  city: string;
  marketSize: number;      // 0-100
  prestige: number;        // 0-100
  fanInterest: number;     // 0-100
  morale: number;          // 0-100
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
}
```

---

# Team Lineup

```ts
interface TeamLineup {
  battingOrderPlayerIds: string[]; // length 9
  defensiveAssignments: Record<FieldPosition, string>;
  designatedHitterPlayerId?: string;
}
```

```ts
type FieldPosition =
  | "P"
  | "C"
  | "1B"
  | "2B"
  | "3B"
  | "SS"
  | "LF"
  | "CF"
  | "RF"
  | "DH";
```

---

# Pitching Rotation

```ts
interface PitchingRotation {
  starterPlayerIds: string[]; // usually 4 or 5
  nextStarterIndex: number;
}
```

---

# Team Strategy Profile

```ts
interface TeamStrategyProfile {
  aggressiveness: number;     // 0-100
  youthFocus: number;         // 0-100
  spendingTolerance: number;  // 0-100
  stealFrequency: number;     // 0-100
  bullpenQuickHook: number;   // 0-100
}
```

Used mostly for AI teams.

---

# Player Entity

```ts
interface Player {
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
  overall: number;        // 0-100
  potential: number;      // 0-100
  morale: number;         // 0-100
  fatigue: number;        // 0-100
  injuryProneness: number;// 0-100
  personality: PersonalityProfile;
  ratings: PlayerRatings;
  development: DevelopmentProfile;
  contractId?: string;
  currentTeamId?: string;
  serviceTimeDays: number;
  isRetiringAfterSeason: boolean;
  status: PlayerStatus;
  seasonStats: PlayerSeasonStats;
  careerStats: PlayerCareerStats;
}
```

```ts
type Handedness = "L" | "R" | "S";

type PlayerPosition =
  | "SP"
  | "RP"
  | "C"
  | "1B"
  | "2B"
  | "3B"
  | "SS"
  | "LF"
  | "CF"
  | "RF"
  | "DH";

type PlayerStatus =
  | "active"
  | "reserve"
  | "injured"
  | "freeAgent"
  | "retired"
  | "suspended";
```

---

# Personality Profile

```ts
interface PersonalityProfile {
  loyalty: number;        // 0-100
  greed: number;          // 0-100
  leadership: number;     // 0-100
  workEthic: number;      // 0-100
  competitiveness: number;// 0-100
  consistency: number;    // 0-100
}
```

---

# Player Ratings

```ts
interface PlayerRatings {
  hitting: HittingRatings;
  defense: DefenseRatings;
  speed: SpeedRatings;
  pitching?: PitchingRatings;
}
```

## Hitting Ratings

```ts
interface HittingRatings {
  contact: number;
  power: number;
  plateDiscipline: number;
  clutch: number;
}
```

## Defense Ratings

```ts
interface DefenseRatings {
  fielding: number;
  range: number;
  arm: number;
  catcherFraming?: number;
}
```

## Speed Ratings

```ts
interface SpeedRatings {
  speed: number;
  stealing: number;
  baserunningIQ: number;
}
```

## Pitching Ratings

```ts
interface PitchingRatings {
  velocity: number;
  control: number;
  movement: number;
  stamina: number;
  holdRunners: number;
}
```

---

# Development Profile

```ts
interface DevelopmentProfile {
  growthRate: number;        // 0.5 - 1.5 typical
  declineRate: number;       // 0.5 - 1.5 typical
  peakAgeStart: number;
  peakAgeEnd: number;
  lastWeeklyDevelopmentTick?: string;
}
```

---

# Staff Member

```ts
interface StaffMember {
  id: string;
  fullName: string;
  role: StaffRole;
  skillRatings: StaffSkillRatings;
  salary: number;
  contractYearsRemaining: number;
  currentTeamId?: string;
}
```

```ts
type StaffRole =
  | "manager"
  | "hittingCoach"
  | "pitchingCoach"
  | "trainer"
  | "scout"
  | "generalManager";
```

```ts
interface StaffSkillRatings {
  playerDevelopment: number;
  injuryPrevention: number;
  scoutingAccuracy: number;
  moraleManagement: number;
  tactics: number;
}
```

---

# Contract Entity

```ts
interface Contract {
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
}
```

```ts
interface ContractBonusClause {
  type: "gamesPlayed" | "allStar" | "promotionAchieved" | "awardWon";
  amount: number;
}
```

---

# Stadium Entity

```ts
interface Stadium {
  id: string;
  name: string;
  city: string;
  capacity: number;
  condition: number;     // 0-100
  fanExperience: number; // 0-100
  fieldQuality: number;  // 0-100
  lightingQuality: number; // 0-100
  hasLuxuryBoxes: boolean;
}
```

---

# Facility State

```ts
interface FacilityState {
  teamId: string;
  trainingFacilityLevel: number;
  medicalFacilityLevel: number;
  scoutingOfficeLevel: number;
  stadiumUpgradeLevel: number;
  maintenanceBacklog: number;
}
```

---

# Team Finance State

```ts
interface TeamFinanceState {
  teamId: string;
  currentCash: number;
  currentDebt: number;
  payrollMonthly: number;
  staffCostsMonthly: number;
  facilityUpkeepMonthly: number;
  scoutingBudgetMonthly: number;
  marketingBudgetMonthly: number;
  ticketPrice: number;
  merchandiseStrength: number; // 0-100
  sponsorRevenueMonthly: number;
  lastMonthRevenueBreakdown: RevenueBreakdown;
  lastMonthExpenseBreakdown: ExpenseBreakdown;
}
```

```ts
interface RevenueBreakdown {
  ticketSales: number;
  sponsorships: number;
  merchandise: number;
  playoffRevenue: number;
  transferFees: number;
  other: number;
}
```

```ts
interface ExpenseBreakdown {
  payroll: number;
  staff: number;
  travel: number;
  upkeep: number;
  scouting: number;
  marketing: number;
  debtService: number;
  other: number;
}
```

---

# Scouting Department

```ts
interface ScoutingDepartment {
  teamId: string;
  scoutingAccuracy: number; // 0-100
  domesticCoverage: number; // 0-100
  internationalCoverage: number; // 0-100
  prospectBoard: ProspectReport[];
}
```

```ts
interface ProspectReport {
  playerId: string;
  scoutedOverallEstimate: number;
  scoutedPotentialEstimate: number;
  confidence: number; // 0-100
  notes: string[];
  lastScoutedDate: string;
}
```

---

# Injury Record

```ts
interface InjuryRecord {
  id: string;
  playerId: string;
  injuryType: string;
  severity: InjurySeverity;
  startDate: string;
  expectedReturnDate: string;
  gamesRemainingEstimate: number;
  isActive: boolean;
}
```

```ts
type InjurySeverity = "minor" | "moderate" | "major";
```

---

# Scheduled Game

```ts
interface ScheduledGame {
  id: string;
  leagueId: string;
  season: number;
  date: string;
  homeTeamId: string;
  awayTeamId: string;
  status: GameStatus;
  result?: GameResult;
  weather?: GameWeather;
}
```

```ts
type GameStatus =
  | "scheduled"
  | "inProgress"
  | "completed"
  | "postponed"
  | "cancelled";
```

---

# Game Result

```ts
interface GameResult {
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
  boxScore: BoxScore;
  simSummary: SimSummary;
}
```

---

# Box Score

```ts
interface BoxScore {
  battingLines: Record<string, BattingLine>;
  pitchingLines: Record<string, PitchingLine>;
  errorsByTeam: Record<string, number>;
}
```

```ts
interface BattingLine {
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
}
```

```ts
interface PitchingLine {
  playerId: string;
  inningsPitched: number;
  hitsAllowed: number;
  earnedRuns: number;
  walks: number;
  strikeouts: number;
  homeRunsAllowed: number;
  pitchesThrown: number;
}
```

---

# Sim Summary

Useful for debugging and analytics:

```ts
interface SimSummary {
  randomSeedUsed: string;
  totalPlateAppearances: number;
  totalHits: number;
  totalWalks: number;
  totalStrikeouts: number;
  runnerAdvancementEvents: number;
  injuryEvents: number;
}
```

---

# League Standings

```ts
interface LeagueStandings {
  leagueId: string;
  rows: StandingsRow[];
  lastUpdatedDate: string;
}
```

```ts
interface StandingsRow {
  teamId: string;
  wins: number;
  losses: number;
  winPct: number;
  runsFor: number;
  runsAgainst: number;
  runDifferential: number;
  streak: number; // positive win streak, negative losing streak
  averageAttendance: number;
}
```

---

# Story State

Tracks narrative progression around inheriting the club and climbing the ladder.

```ts
interface StoryState {
  introCompleted: boolean;
  currentChapter: StoryChapter;
  unlockedCutsceneIds: string[];
  completedObjectiveIds: string[];
  activeObjectiveIds: string[];
}
```

```ts
type StoryChapter =
  | "inheritance"
  | "rebuild"
  | "firstPromotionPush"
  | "nextTierArrival"
  | "dynasty";
```

---

# Objectives

```ts
interface Objective {
  id: string;
  title: string;
  description: string;
  category: ObjectiveCategory;
  targetValue?: number;
  currentValue?: number;
  completed: boolean;
  reward?: ObjectiveReward;
}
```

```ts
type ObjectiveCategory =
  | "financial"
  | "competitive"
  | "attendance"
  | "facility"
  | "story";

interface ObjectiveReward {
  cash?: number;
  prestige?: number;
  fanInterest?: number;
}
```

---

# Mailbox State

Use a mailbox/inbox system for news, advice, injuries, sponsor notes, and story beats.

```ts
interface MailboxState {
  messages: MailMessage[];
  unreadCount: number;
}
```

```ts
interface MailMessage {
  id: string;
  date: string;
  sender: string;
  subject: string;
  body: string;
  category: MailCategory;
  isRead: boolean;
  relatedEntityId?: string;
}
```

```ts
type MailCategory =
  | "news"
  | "injury"
  | "sponsorship"
  | "story"
  | "league"
  | "staff";
```

---

# Event Log Entry

The event log is critical for save debugging and future multiplayer replay/auditing.

```ts
interface EventLogEntry {
  id: string;
  timestamp: string;
  actionType: string;
  actorTeamId?: string;
  actorPlayerId?: string;
  payload: Record<string, unknown>;
  summary: string;
}
```

---

# Pending Actions

Used for command-based updates and later server syncing.

```ts
interface PendingAction {
  id: string;
  type: ActionType;
  createdAt: string;
  payload: Record<string, unknown>;
  status: PendingActionStatus;
}
```

```ts
type ActionType =
  | "SIGN_PLAYER"
  | "RELEASE_PLAYER"
  | "SET_LINEUP"
  | "SET_ROTATION"
  | "SET_TICKET_PRICE"
  | "RUN_MARKETING"
  | "UPGRADE_FACILITY"
  | "ADVANCE_DAY"
  | "ADVANCE_WEEK"
  | "PROMOTE_TEAM"
  | "PROCESS_OFFSEASON";

type PendingActionStatus =
  | "queued"
  | "processed"
  | "failed";
```

---

# Recommended Save File Shape

A save file can be stored as:

```json
{
  "meta": {},
  "rng": {},
  "world": {},
  "leagues": {},
  "teams": {},
  "players": {},
  "stadiums": {},
  "staff": {},
  "contracts": {},
  "schedule": {},
  "standings": {},
  "finances": {},
  "facilities": {},
  "scouting": {},
  "injuries": {},
  "story": {},
  "mailbox": {},
  "eventLog": [],
  "pendingActions": []
}
```

---

# Validation Strategy

Use runtime validation to protect the game from corrupted saves.

Recommended tools:
- Zod
- TypeScript interfaces/types
- migration functions per schema version

Example pattern:

```ts
const GameStateSchema = z.object({
  meta: SaveMetaSchema,
  rng: RngStateSchema,
  world: WorldStateSchema,
  leagues: z.record(LeagueSchema),
  teams: z.record(TeamSchema),
  players: z.record(PlayerSchema),
});
```

---

# Serialization Rules

## Dates
Use ISO strings everywhere.

Examples:
- `2027-04-12`
- `2027-04-12T19:00:00Z`

## Money
Store as integer cents if precision becomes important.

Phase 1 can use whole-number dollars if desired.

## Percentages / ratings
Store as integers `0-100` unless a decimal is required.

---

# Migration Strategy

Every save-load pipeline should check `schemaVersion`.

Example:

```ts
function migrateSave(save: unknown): GameState {
  // detect version
  // apply migrations in sequence
  // return latest schema
}
```

Example migration use cases:
- added morale field
- added scouting department
- changed batting order structure

---

# API Readiness for Multiplayer

These schemas should also map cleanly to future API DTOs.

Example future endpoints:
- `GET /save/:id`
- `POST /action`
- `GET /league/:id/standings`
- `GET /team/:id/roster`

Because the data is already normalized and ID-based, the transition is much easier.

---

# Phase 1 Minimum Required Entities

For the first playable build, the minimum must include:

- GameState
- SaveMeta
- WorldState
- League
- Team
- Player
- TeamLineup
- PitchingRotation
- Contract
- Stadium
- TeamFinanceState
- ScheduledGame
- GameResult
- LeagueStandings
- EventLogEntry
- PendingAction

The other entities can be included early, but these are the essentials.

---

# Recommended Build Order

## Step 1
Define all TypeScript types and Zod schemas

## Step 2
Build save/load with schema validation

## Step 3
Create world generation factories
- generateLeague
- generateTeam
- generatePlayer
- generateSchedule

## Step 4
Implement simulation input/output using these schemas

## Step 5
Add UI bindings for dashboard, roster, standings, and results

---

# Summary

This schema document gives the project a stable foundation for:

- single-player saves
- deterministic simulation
- future cloud sync
- eventual async multiplayer
- maintainable long-term development

A strong schema now will prevent major refactoring later.
