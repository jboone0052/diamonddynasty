# Baseball Franchise Simulator --- Simulation Engine Specification

## Purpose

This document defines the mathematical and systemic rules used by the
simulation engine.\
The goal is to create a **consistent, believable baseball simulation**
that supports long-term franchise gameplay.

The simulation must be:

-   deterministic where possible
-   tunable through configuration
-   fast enough to simulate entire seasons instantly
-   server compatible for future multiplayer

------------------------------------------------------------------------

# Simulation Model Overview

Games are simulated at the **plate appearance level**.

The engine does NOT simulate individual pitches in Phase 1.

Instead:

    Plate Appearance -> Outcome -> Runner Advancement -> Game State Update

Each plate appearance is determined by:

-   batter attributes
-   pitcher attributes
-   defensive modifiers
-   game situation
-   randomness

------------------------------------------------------------------------

# Core Ratings

All player attributes range:

    0 - 100

League averages are designed around:

    50 = average professional player

------------------------------------------------------------------------

# Batter Ratings

  Attribute         Purpose
  ----------------- -----------------------------
  Contact           ability to put ball in play
  Power             extra base hits
  PlateDiscipline   walk probability
  Clutch            performance in key moments

Derived batter score:

    BatterScore =
    (Contact * 0.45)
    + (Power * 0.35)
    + (PlateDiscipline * 0.20)

------------------------------------------------------------------------

# Pitcher Ratings

  Attribute   Purpose
  ----------- -------------------
  Velocity    strikeout ability
  Control     walk prevention
  Movement    hit suppression
  Stamina     endurance

Derived pitcher score:

    PitcherScore =
    (Velocity * 0.40)
    + (Control * 0.35)
    + (Movement * 0.25)

------------------------------------------------------------------------

# Plate Appearance Resolution

Calculate matchup rating:

    MatchupScore = BatterScore - PitcherScore

Add randomness:

    AdjustedScore = MatchupScore + random(-15, +15)

AdjustedScore determines outcome bucket.

------------------------------------------------------------------------

# Outcome Probability Buckets

  Score Range   Result
  ------------- ----------------
  \<-40         Strikeout
  -40 to -10    Ground/Fly Out
  -10 to 5      Single
  5 to 15       Double
  15 to 25      Triple
  \>25          Home Run

Walk probability calculated separately.

------------------------------------------------------------------------

# Walk Calculation

Walk probability:

    WalkChance =
    PlateDiscipline * 0.4
    - PitcherControl * 0.3
    + random(0,10)

If:

    WalkChance > 30

Result = walk.

------------------------------------------------------------------------

# Runner Advancement

Runner advancement depends on:

-   hit type
-   runner speed
-   randomness

Example:

## Single

  Runner Base   Advance
  ------------- -------------------------
  1st           50% chance to reach 3rd
  2nd           80% chance to score
  3rd           score

Speed modifies advancement probability.

------------------------------------------------------------------------

# Stolen Bases

Attempt logic:

    StealChance =
    RunnerSpeed * 0.6
    + random(0,20)

If above threshold → attempt steal.

Success chance:

    Success =
    RunnerSpeed - CatcherArm + random(-10,10)

------------------------------------------------------------------------

# Defensive Influence

Defense impacts:

-   hit conversion
-   extra base prevention

Team defense rating:

    DefenseRating =
    average(fielding + range)

Defense modifier applied:

    AdjustedScore -= (DefenseRating - 50) * 0.3

------------------------------------------------------------------------

# Fatigue System

Pitchers lose stamina each inning.

    StaminaLoss = pitchesThrown * 0.05

When stamina \< 40:

Pitcher effectiveness decreases:

    PitcherScore -= 10

When stamina \< 20:

    PitcherScore -= 20

------------------------------------------------------------------------

# Injury Probability

Calculated each game.

Base chance:

    0.3% per game

Modifiers:

  Factor        Effect
  ------------- --------
  Low stamina   +0.5%
  Low morale    +0.2%
  Age \> 32     +0.4%

------------------------------------------------------------------------

# Player Development

Weekly development tick.

Improvement formula:

    Development =
    (Potential - CurrentRating)
    * WorkEthicModifier
    * CoachingQuality
    * RandomFactor

Example modifiers:

  Factor       Range
  ------------ ----------
  Work Ethic   0.8--1.2
  Coaching     0.9--1.1
  Random       0.9--1.1

Young players develop faster.

Age modifier:

  Age      Modifier
  -------- ----------------
  18--22   1.4
  23--26   1.1
  27--30   0.7
  31+      decline begins

------------------------------------------------------------------------

# Player Decline

Players decline after age 30.

    DeclineRate =
    (Age - 30) * random(0.5,1.5)

Attributes slowly decrease.

------------------------------------------------------------------------

# Salary Market System

Salary expectation:

    Salary =
    BaseLeagueSalary
    * (OverallRating / 50)
    * DemandFactor

Demand factor depends on:

-   number of interested teams
-   position scarcity
-   recent performance

------------------------------------------------------------------------

# AI Roster Decisions

AI evaluates players using:

    ValueScore =
    (OverallRating * 0.6)
    + (Potential * 0.2)
    + (AgeModifier * 0.2)

AI signs players if:

    ValueScore / Salary > Threshold

------------------------------------------------------------------------

# Game Speed Requirements

Simulation must support:

-   instant single game simulation
-   simulating full season in \< 1 second

This ensures fast gameplay loops.

------------------------------------------------------------------------

# Randomness System

Use seeded random generator.

Example seed:

    seed = gameID + plateAppearanceNumber

Ensures deterministic results for multiplayer servers.

------------------------------------------------------------------------

# Tuning Strategy

All weights must be configurable.

Example config:

    sim_config.json

Contains:

-   attribute weights
-   outcome thresholds
-   injury rates
-   development curves

This allows future balancing without code changes.

------------------------------------------------------------------------

# Multiplayer Compatibility

For multiplayer:

Simulation will run on **authoritative server**.

Clients submit actions:

-   lineup changes
-   trades
-   promotions
-   contracts

Server runs simulation and returns results.

------------------------------------------------------------------------

# Performance Targets

The engine must support:

  Task              Target
  ----------------- ----------
  Single game sim   \< 5ms
  Season sim        \< 500ms
  League sim        \< 1s

------------------------------------------------------------------------

# Phase 1 Scope

Phase 1 simulation includes:

-   hitting
-   pitching
-   basic defense
-   runner advancement
-   injuries
-   development
-   AI roster management

Later phases add:

-   advanced pitch types
-   weather effects
-   ballpark factors
-   analytics modeling

------------------------------------------------------------------------

# Summary

The simulation engine is designed to be:

-   scalable
-   tunable
-   deterministic
-   multiplayer compatible

This engine will power all league gameplay across both single player and
multiplayer modes.
