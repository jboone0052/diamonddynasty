# Baseball Franchise Simulator --- Technical & Product Documentation

## Overview

A cross‑platform sports management simulation game where the player
inherits a struggling low‑tier baseball team and attempts to build it
into a championship franchise by climbing a fictional league pyramid.

The game will launch initially as **single player**, but architecture
will support **future asynchronous multiplayer leagues**.

Platforms: - Web - iOS - Android

Primary goals: - Deep management simulation - Fictional baseball
ecosystem (no licensed teams/players) - Cross‑platform gameplay -
Expandable multiplayer architecture

------------------------------------------------------------------------

# Game Premise

The player inherits a small semi‑professional baseball team from their
grandfather. The club is nearly bankrupt and plays in a low tier
regional league.

The player's objective is to: - stabilize finances - improve roster
quality - grow fan support - upgrade facilities - earn promotion through
the baseball pyramid

------------------------------------------------------------------------

# League Pyramid

  Tier   League                               Level
  ------ ------------------------------------ --------------------
  1      Premier Baseball League (PBL)        Elite Professional
  2      National Championship League (NCL)   Major Professional
  3      Continental League (CL)              Professional
  4      Regional League (RL)                 Semi‑Professional
  5      Community League (COL)               Amateur

Starting tier: **Regional League**

------------------------------------------------------------------------

# Phase 1 Objective

Deliver a **fully playable single‑season management simulation**.

Players must be able to:

-   Start a new franchise
-   Manage roster
-   Simulate games
-   Manage finances
-   Improve attendance
-   Complete one season
-   Earn promotion

------------------------------------------------------------------------

# Architecture

## Frontend

Cross‑platform UI

Technology: - React Native - Expo - Expo Web - TypeScript

Advantages: - Shared codebase - Native mobile performance - Web
deployment

------------------------------------------------------------------------

## Shared Game Core

Language: TypeScript

Responsibilities:

-   League generation
-   Player generation
-   Schedule generation
-   Game simulation
-   Financial simulation
-   Promotion rules
-   Event system
-   Serialization for save/load

Location:

    packages/game-core

This core must be **framework agnostic**.

------------------------------------------------------------------------

## Future Backend

Not required in Phase 1.

Future responsibilities:

-   user accounts
-   cloud saves
-   multiplayer league state
-   authoritative simulation
-   anti-cheat validation

Potential stack:

-   Node.js / TypeScript
-   PostgreSQL
-   Redis

------------------------------------------------------------------------

# Game State Model

All gameplay is stored inside a single **GameState** object.

Example structure:

    GameState
        world
        leagues
        teams
        players
        schedule
        standings
        finances
        facilities
        currentDate
        events

Game state must be:

-   serializable
-   deterministic
-   versioned

------------------------------------------------------------------------

# Entity Models

## Player

Attributes:

  Attribute   Description
  ----------- ---------------------
  id          unique identifier
  name        generated name
  age         player age
  position    field position
  batting     hit skill
  power       HR ability
  speed       base running
  defense     fielding
  pitching    pitching ability
  potential   development ceiling
  salary      yearly salary

------------------------------------------------------------------------

## Team

  Attribute     Description
  ------------- --------------------
  id            team id
  name          team name
  city          fictional city
  stadiumId     stadium reference
  budget        team finances
  fanInterest   popularity
  roster        list of player ids

------------------------------------------------------------------------

## League

  Attribute        Description
  ---------------- ------------------
  id               league id
  name             league name
  tier             level in pyramid
  teams            list of team ids
  promotionSpots   number promoted

------------------------------------------------------------------------

# Action / Command System

All player decisions are actions.

Examples:

    SIGN_PLAYER
    RELEASE_PLAYER
    SET_LINEUP
    SET_TICKET_PRICE
    RUN_MARKETING
    UPGRADE_STADIUM
    ADVANCE_WEEK

Each action:

1.  validates input
2.  updates game state
3.  returns new state

This enables future multiplayer compatibility.

------------------------------------------------------------------------

# Game Simulation Model

Simulation operates at **plate appearance level**.

Outcome determined by:

    batterRating
    vs
    pitcherRating
    +
    randomness

Possible outcomes:

-   strikeout
-   walk
-   single
-   double
-   triple
-   home run
-   out

------------------------------------------------------------------------

# Season System

Example Phase 1 structure:

-   8 teams
-   60 games
-   round robin schedule

Standings tracked as:

| Team \| Wins \| Losses \|

------------------------------------------------------------------------

# Finances

Revenue sources:

  Source        Description
  ------------- ------------------
  Tickets       attendance based
  Sponsorship   monthly income
  Merchandise   fan popularity

Expenses:

  Source            Description
  ----------------- ---------------
  Player salaries   payroll
  Staff salaries    coaches
  Facility upkeep   stadium costs

------------------------------------------------------------------------

# Fan Interest System

Fan interest value: **0--100**

Influenced by:

-   wins
-   marketing
-   ticket price
-   promotions
-   stadium quality

Attendance calculation:

    attendance = stadiumCapacity * (fanInterest / 100)

------------------------------------------------------------------------

# Promotion Requirements

To move to next league:

-   finish top 2
-   stadium capacity requirement
-   minimum finances
-   attendance threshold

------------------------------------------------------------------------

# Phase 1 Screens

Required UI:

### Dashboard

-   record
-   finances
-   upcoming games

### Roster

-   player list
-   contracts
-   stats

### Lineup

-   batting order
-   rotation

### Standings

-   league table

### Schedule

-   upcoming games
-   results

### Finances

-   revenue
-   expenses

### Promotion Status

-   requirements tracker

------------------------------------------------------------------------

# Save System

Phase 1:

Local saves

-   JSON based
-   versioned schema
-   autosave weekly

Future:

Cloud saves.

------------------------------------------------------------------------

# Development Milestones

## Milestone 1

Core simulation

-   player generator
-   team generator
-   schedule
-   game engine

## Milestone 2

Management layer

-   roster screen
-   lineup
-   finances
-   attendance

## Milestone 3

Season completion

-   standings
-   promotion logic
-   end-of-season screen

------------------------------------------------------------------------

# Multiplayer Roadmap

## Phase 1

Single player only

## Phase 2

Cloud saves

## Phase 3

Async multiplayer leagues

Players each control one team.

League advances when: - all players ready or - weekly timer

## Phase 4

Online features

-   leaderboards
-   seasonal leagues
-   tournaments

------------------------------------------------------------------------

# Project Structure

    /apps
        /game-app

    /packages
        /game-core
        /ui
        /content

------------------------------------------------------------------------

# Success Criteria

Phase 1 is successful if players can:

-   start a franchise
-   manage a team
-   simulate a full season
-   see standings
-   earn promotion
