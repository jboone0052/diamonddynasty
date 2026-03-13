
# Baseball Franchise Simulator
## Full Game Design Document (GDD)

## 1. Game Overview

Premise:
You inherit a struggling lower‑tier baseball franchise from your grandfather.
Your goal is to rebuild the organization, develop players, upgrade facilities,
and earn promotion through a fictional league pyramid until reaching the top league.

Core Player Fantasy:
- Build a baseball dynasty from nothing
- Develop unknown players into stars
- Upgrade facilities and stadium
- Balance finances while competing
- Earn promotion through performance

---

## 2. Core Gameplay Loop

1. Review roster and lineup
2. Adjust tactics or training
3. Play or simulate games
4. Earn revenue from attendance and sponsors
5. Manage player morale and fatigue
6. Scout or sign players
7. Upgrade facilities
8. Advance the season
9. Qualify for promotion

---

## 3. League Structure

Example fictional pyramid:

Tier 1 – National Premier League  
Tier 2 – Continental League  
Tier 3 – Regional Elite League  
Tier 4 – Atlantic Regional League (Starting league)

Promotion rules:
Top 2 teams qualify for promotion playoffs.

Promotion also requires:
- Stadium capacity minimum
- Cash reserve minimum
- Fan attendance threshold

---

## 4. Player System

Player attributes:

Hitting
- Contact
- Power
- Plate Discipline
- Clutch

Defense
- Fielding
- Range
- Arm

Speed
- Speed
- Stealing
- Baserunning IQ

Pitching
- Velocity
- Control
- Movement
- Stamina

Other attributes:
- Morale
- Fatigue
- Loyalty
- Work Ethic
- Competitiveness

Overall rating is derived from these attributes.

---

## 5. Player Development

Players improve through:

- Training facilities
- Playing time
- Coaching staff quality
- Age curve

Typical progression:

18–22 Rapid development  
23–27 Prime growth  
28–31 Peak performance  
32+ Decline

---

## 6. Contracts

Contracts include:

- Salary
- Length
- Bonuses
- Loyalty modifiers

Negotiations influenced by:

- Team prestige
- Market size
- Player morale
- Agent personality

---

## 7. Team Morale

Morale affects performance.

Influencing factors:

- Winning streaks
- Playing time
- Salary satisfaction
- Team leadership

Low morale reduces player effectiveness.

---

## 8. Scouting System

Scouts reveal hidden player attributes.

Scout skills:

- Amateur scouting
- Pro scouting
- Accuracy
- Regional knowledge

Better scouts provide more reliable reports.

---

## 9. Financial System

Revenue:

- Ticket sales
- Sponsorships
- Merchandise
- Promotion bonuses

Expenses:

- Payroll
- Staff salaries
- Stadium maintenance
- Facility upgrades

Financial stability is required for promotion.

---

## 10. Facilities

Facilities influence development and fan experience.

Examples:

Training Center  
Medical Center  
Scouting Department  
Youth Academy  
Stadium

Upgrades improve team performance and revenue.

---

## 11. Marketing

Marketing raises fan interest.

Examples:

Community events  
Giveaways  
Advertising campaigns

Higher fan interest increases attendance and merchandise sales.

---

## 12. Injuries

Possible injury types:

Minor (days)  
Moderate (weeks)  
Major (season-ending)

Medical staff reduce injury duration.

---

## 13. Season Structure

Preseason:
Training and roster decisions

Regular Season:
Weekly games

Playoffs:
Top teams compete

Offseason:
Contracts, scouting, free agency

---

## 14. Random Events

Examples:

Sponsor opportunity  
Star player injury  
Stadium damage  
Prospect discovery  
Media controversy

Events introduce unpredictability.

---

## 15. Multiplayer Vision

Future multiplayer modes:

- Online leagues
- Competitive seasons
- Franchise trading
- Shared economy leagues

The simulation must remain deterministic.

---

## 16. UI Screens

Main Dashboard  
Roster Management  
Lineup Editor  
League Standings  
Schedule  
Finances  
Stadium  
Scouting  
Mailbox

---

## 17. Save System

Game state stored as JSON including:

- World state
- Teams
- Players
- Finances
- Schedule
- Standings
- Event history

Schema versioning allows upgrades.

---

## 18. Long Term Goals

Reach the top league  
Win national championship  
Build a powerful franchise  
Develop legendary players
