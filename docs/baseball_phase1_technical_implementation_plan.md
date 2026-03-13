
# Baseball Franchise Simulator — Phase 1 Technical Implementation Plan

## Purpose
This document defines the practical build plan for Phase 1 of the baseball franchise simulator.

Phase 1 goal:

> Deliver a playable vertical slice where the player can inherit a low-tier team, manage one full season, and attempt the first promotion.

This plan is written to be implementation-focused, with clear milestones, folders, systems, and backlog items.

---

# Phase 1 Scope

## In Scope
Phase 1 includes:

- single-player only
- one human-controlled team
- one fictional starting league
- AI-controlled opponent teams
- one playable season
- roster management
- lineup management
- schedule generation
- game simulation
- standings
- finances
- attendance
- promotion evaluation
- local save/load
- web + mobile support

## Out of Scope
These should not be built in Phase 1:

- multiplayer
- cloud saves
- trading system
- advanced scouting
- deep staff management
- full stadium builder
- multiple playable leagues
- detailed contract negotiation UI
- live game presentation
- advanced analytics dashboards
- in-app purchases
- account system

---

# Platform & Stack

## Frontend / App Shell
- React Native
- Expo
- Expo Web
- TypeScript

## State Management
- Zustand

## Validation / Schema
- Zod

## Storage
- local persistence only
- AsyncStorage / local storage abstraction

## Monorepo Structure
Recommended:

```text
/apps
  /game-app

/packages
  /game-core
  /ui
  /content
  /config
```

---

# Repository Structure

## `/apps/game-app`
Contains the actual app entrypoint and UI screens.

Suggested folders:

```text
/apps/game-app
  /app
  /src
    /components
    /screens
    /navigation
    /stores
    /hooks
    /utils
    /styles
```

## `/packages/game-core`
Pure simulation logic and state transformation.

Suggested folders:

```text
/packages/game-core
  /src
    /types
    /schemas
    /factories
    /sim
    /systems
    /actions
    /queries
    /persistence
    /constants
```

## `/packages/ui`
Reusable shared UI components.

```text
/packages/ui
  /src
    /components
    /theme
```

## `/packages/content`
Story text, league names, team names, event text, objective text.

```text
/packages/content
  /src
    /story
    /world
    /events
    /objectives
```

## `/packages/config`
Balance and tuning files.

```text
/packages/config
  /src
    simConfig.ts
    economyConfig.ts
    worldConfig.ts
```

---

# Core Technical Principles

## 1. Shared Simulation Core
All gameplay logic must live in `game-core`, not the UI app.

The UI should:
- display state
- dispatch actions
- render results

The UI should not:
- contain game rules
- mutate game objects directly
- run business logic inline

## 2. Action-Based State Updates
All major updates should flow through actions.

Examples:
- `SIGN_PLAYER`
- `SET_LINEUP`
- `SET_TICKET_PRICE`
- `ADVANCE_WEEK`

Pattern:

```ts
state -> action -> reducer/system -> new state
```

## 3. Deterministic Randomness
Use seeded randomness in simulation code so game results can be reproduced if needed.

## 4. Validation at Boundaries
Validate save files, content files, and important state transitions.

---

# Phase 1 User Flow

## New Game Flow
1. Start new game
2. Show inheritance intro
3. Generate world
4. Assign user team
5. Show dashboard
6. Prompt player to review roster and set lineup

## Core Gameplay Loop
1. Review inbox / events
2. Review roster and injuries
3. Adjust lineup
4. Review finances and ticket price
5. Advance week
6. Simulate games
7. Review standings and team health
8. Repeat until season end

## End of Season Flow
1. Final standings generated
2. Promotion requirements evaluated
3. Story result shown
4. Save updated
5. Option to continue or start new save

---

# Milestone Plan

# Milestone 0 — Project Setup

## Objective
Stand up the project foundation and shared packages.

## Tasks
- create monorepo structure
- initialize Expo app
- configure TypeScript path aliases
- configure workspace package sharing
- add Zustand
- add Zod
- add linting and formatting
- add test runner for `game-core`
- create basic navigation shell
- create placeholder screens

## Deliverable
A running app on web and mobile with placeholder navigation and shared package imports working.

---

# Milestone 1 — Data Model & Persistence Foundation

## Objective
Implement the schemas, types, and save system that everything else will rely on.

## Tasks
- define `GameState` types
- define entity types (`Player`, `Team`, `League`, etc.)
- define Zod schemas
- implement schema validation
- implement save serialization
- implement save deserialization
- implement schema versioning
- implement local save repository
- create one test save file

## Deliverable
The app can create, save, load, and validate a blank or generated game state.

## Key Files
```text
/packages/game-core/src/types
/packages/game-core/src/schemas
/packages/game-core/src/persistence
```

---

# Milestone 2 — World Generation

## Objective
Generate a fresh playable world.

## Tasks
- create fictional league definitions
- create fictional team name pool
- create player name generator
- create player factory
- create team factory
- create stadium factory
- generate 8-team starting league
- generate rosters
- assign contracts
- generate initial finances
- generate starting lineup and rotation
- generate intro objectives

## Deliverable
New game creation produces a complete playable world.

## Key Files
```text
/packages/game-core/src/factories/createWorld.ts
/packages/game-core/src/factories/createPlayer.ts
/packages/game-core/src/factories/createTeam.ts
/packages/content/src/world
```

---

# Milestone 3 — Schedule & Standings

## Objective
Allow the season structure to function.

## Tasks
- define season calendar
- generate round-robin schedule
- create scheduled game entities
- create standings model
- implement standings update system
- compute wins/losses
- compute runs for / against
- compute streaks
- compute average attendance

## Deliverable
A complete season schedule exists and standings update after games are completed.

## Key Files
```text
/packages/game-core/src/systems/schedule
/packages/game-core/src/systems/standings
```

---

# Milestone 4 — Simulation Engine

## Objective
Simulate actual baseball games and update the game world.

## Tasks
- build seeded RNG utility
- implement batter vs pitcher resolution
- implement walk logic
- implement hit outcome logic
- implement runner advancement
- implement scoring
- implement pitcher fatigue
- implement injuries
- generate box score
- generate game result
- update player season stats
- update morale/fatigue after games

## Deliverable
A scheduled game can be simulated into a valid result with updated team and player state.

## Key Files
```text
/packages/game-core/src/sim
/packages/game-core/src/systems/simulateGame.ts
```

---

# Milestone 5 — Weekly Progression System

## Objective
Allow the player to advance through the season.

## Tasks
- implement `ADVANCE_WEEK`
- identify games for current week
- simulate all scheduled games in correct order
- process finances for the week
- process injuries and recovery
- process morale changes
- process weekly development tick
- update inbox messages
- update objectives and event log
- increment current week/date

## Deliverable
The player can advance week by week through the season.

## Key Files
```text
/packages/game-core/src/actions/advanceWeek.ts
/packages/game-core/src/systems/processWeek.ts
```

---

# Milestone 6 — Team Management Actions

## Objective
Allow meaningful player control.

## Tasks
- implement `SET_LINEUP`
- implement `SET_ROTATION`
- implement `SIGN_PLAYER`
- implement `RELEASE_PLAYER`
- implement `SET_TICKET_PRICE`
- validate roster constraints
- validate lineup constraints
- update payroll on sign/release
- update event log on actions

## Deliverable
The player can manage their team before and during the season.

## Key Files
```text
/packages/game-core/src/actions
```

---

# Milestone 7 — Economy, Attendance, and Promotion

## Objective
Connect business management to competitive progress.

## Tasks
- calculate ticket revenue
- calculate sponsor revenue
- calculate payroll expense
- calculate facility upkeep
- calculate attendance from fan interest + pricing
- track average attendance
- define promotion requirements
- evaluate promotion eligibility at season end
- generate promotion result message

## Deliverable
The season ends with a valid promotion/no-promotion outcome.

## Key Files
```text
/packages/game-core/src/systems/economy
/packages/game-core/src/systems/promotion
```

---

# Milestone 8 — Story Layer & Mailbox

## Objective
Add narrative framing and player guidance.

## Tasks
- implement inheritance intro scene
- create initial advisor/inbox messages
- create chapter objective system
- create “first promotion push” story beats
- generate end-of-season result story
- connect story state to UI

## Deliverable
The game feels like a cohesive franchise journey, not just raw spreadsheets.

## Key Files
```text
/packages/content/src/story
/packages/game-core/src/systems/story
```

---

# Milestone 9 — UI Vertical Slice

## Objective
Make the game actually playable and understandable.

## Required Screens
- New Game
- Dashboard
- Inbox
- Roster
- Lineup
- Schedule
- Standings
- Finances
- Promotion Tracker
- Game Result Summary
- End of Season Summary
- Settings / Save Load

## Tasks
- wire navigation
- connect Zustand store to game-core actions
- build responsive layouts for mobile and web
- create reusable stat cards
- create roster list UI
- create standings table/card hybrid
- build week advance button flow
- build loading/simulating states
- build error states for invalid actions

## Deliverable
A full playable vertical slice on web and mobile.

---

# Recommended UI Build Order

## 1. Dashboard
Displays:
- record
- current week
- cash
- fan interest
- next game
- active objectives

## 2. Roster
Displays:
- player list
- status
- overall
- potential
- fatigue
- morale

## 3. Lineup
Allows:
- batting order selection
- defensive assignment edits
- starter rotation edits

## 4. Standings
Displays:
- wins
- losses
- win percentage
- streak
- average attendance

## 5. Schedule / Results
Displays:
- games by week
- completed results
- selected game summary

## 6. Finances
Displays:
- cash on hand
- payroll
- weekly revenue
- weekly expenses
- ticket price control

---

# Store Design

## App Store Layers
Recommended split:

### UI Store
For:
- current selected tab
- modal state
- filters
- sort order

### Game Session Store
For:
- loaded `GameState`
- selected save
- loading/error state
- action dispatch methods

Keep `GameState` itself as close to immutable as possible.

---

# Testing Plan

## Unit Tests
Write tests for:
- player generation
- team generation
- schedule generation
- game simulation outcomes
- standings update
- finance calculations
- promotion evaluation
- save validation

## Property / Invariant Tests
Examples:
- no team has duplicate roster player IDs
- lineup always has 9 unique players
- completed games always produce a winner
- standings wins/losses match game results
- save/load round trip preserves state

## Manual QA Checklist
- start new game on web
- start new game on mobile
- save and load
- advance week repeatedly
- sign and release players
- adjust lineup
- finish season
- verify promotion logic
- verify no crashes from empty edge cases

---

# Content Backlog for Phase 1

## Story Content
- intro inheritance scene
- first advisor message
- season goal messages
- promotion evaluation message
- failure message
- success message

## World Content
- 8 fictional team names
- 8 fictional stadiums
- 200–300 generated player name combinations
- 1 starting league identity
- sponsor names
- local event/marketing flavor text

---

# Engineering Backlog by Priority

## P0 — Must Have
- project setup
- schema/types
- save/load
- world generation
- schedule generation
- standings
- simulation engine
- weekly progression
- roster actions
- finances
- promotion logic
- essential screens

## P1 — Should Have
- intro story
- mailbox
- objectives
- end-of-season summary polish
- better roster sorting/filtering
- injury messaging
- sim summary screen

## P2 — Nice to Have
- richer player cards
- more story flavor events
- better mobile animations
- advanced stat display
- more onboarding tips

---

# Suggested Sprint Breakdown

## Sprint 1
Foundation
- repo setup
- app shell
- package wiring
- types
- schemas
- persistence

## Sprint 2
World & season structure
- world generation
- league/team/player creation
- schedule generation
- standings

## Sprint 3
Simulation core
- game sim
- stats
- fatigue
- injuries
- results

## Sprint 4
Team management + weekly progression
- lineup
- rotation
- sign/release
- advance week
- finances

## Sprint 5
Story + UI vertical slice
- dashboard
- roster
- standings
- schedule
- inbox
- summaries

## Sprint 6
Polish + QA
- bug fixes
- balancing
- save testing
- mobile/web responsiveness

---

# Risks & Mitigations

## Risk 1 — Overbuilding too early
The project could balloon into a giant sim before Phase 1 is playable.

### Mitigation
Lock scope to one league, one season, one promotion.

## Risk 2 — Logic leaks into UI
Business rules may get duplicated in screens.

### Mitigation
Require all state-changing gameplay logic to live in `game-core`.

## Risk 3 — Save format instability
Frequent schema changes can break progress.

### Mitigation
Adopt schema versioning immediately.

## Risk 4 — Mobile UX becomes cramped
Dense roster/standings screens may not translate well to phones.

### Mitigation
Design mobile-first cards with progressive detail expansion.

## Risk 5 — Simulation tuning feels unrealistic
The sim may produce odd results early.

### Mitigation
Use config-driven weights and create balancing passes after end-to-end play exists.

---

# Definition of Done for Phase 1

Phase 1 is complete when a player can:

- create a new save
- read the opening inheritance setup
- review and manage the inherited team
- set lineup and rotation
- sign/release players
- advance week by week
- see game results and standings
- manage ticket price and observe attendance/finances
- complete the season
- receive a promotion decision
- save and reload progress on web and mobile

---

# Immediate Build Order Recommendation

Build these next, in this exact order:

1. monorepo + Expo app shell
2. `GameState` types and Zod schemas
3. save/load repository
4. world generation
5. schedule generation
6. standings system
7. simulation engine
8. weekly progression
9. roster and lineup actions
10. finances + promotion logic
11. dashboard / roster / standings / schedule UI
12. story + mailbox polish

---

# Suggested First Backlog Tickets

## Setup
- Create monorepo workspace
- Initialize Expo app
- Add shared package imports
- Configure TS aliases
- Add lint and format scripts

## Game Core
- Define `GameState` base type
- Add Zod schemas for save metadata
- Add player/team/league schemas
- Create save repository abstraction
- Implement `createNewGame()`

## Simulation
- Implement seeded RNG utility
- Implement `simulatePlateAppearance()`
- Implement `simulateGame()`
- Implement `applyGameResultToStandings()`

## UI
- Build dashboard shell
- Build roster list screen
- Build standings screen
- Build schedule screen
- Add “Advance Week” button flow

---

# Summary

This Phase 1 implementation plan is the bridge between the high-level design docs and the actual build.

It gives the project:
- a clear scope
- a concrete architecture
- an ordered milestone path
- a practical backlog
- a definition of done

Following this plan should get the game to a real playable vertical slice without losing sight of future multiplayer support.
