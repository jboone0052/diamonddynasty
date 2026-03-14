import { economyConfig } from "@baseball-sim/config";
import { GameState } from "../types/gameState";

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

export function expandStadiumCapacity(input: GameState, teamId: string): GameState {
  const team = input.teams[teamId];
  if (!team) {
    throw new Error(`Team ${teamId} not found.`);
  }

  const finance = input.finances[teamId];
  if (!finance) {
    throw new Error(`Finance state not found for team ${teamId}.`);
  }

  const facility = input.facilities[teamId];
  if (!facility) {
    throw new Error(`Facility state not found for team ${teamId}.`);
  }

  const stadium = input.stadiums[team.stadiumId];
  if (!stadium) {
    throw new Error(`Stadium ${team.stadiumId} not found for team ${teamId}.`);
  }

  const seatsAdded = economyConfig.stadiumExpansionSeatsPerUpgrade;
  const costGrowth = 1 + (facility.stadiumUpgradeLevel - 1) * economyConfig.stadiumExpansionCostGrowthPerLevel;
  const upgradeCost = Math.round(seatsAdded * economyConfig.stadiumExpansionCostPerSeat * costGrowth);

  if (finance.currentCash < upgradeCost) {
    throw new Error(`Insufficient cash to expand stadium. Need $${upgradeCost.toLocaleString()}.`);
  }

  const state = clone(input);
  const updatedFacility = state.facilities[teamId];
  const updatedFinance = state.finances[teamId];
  const updatedTeam = state.teams[teamId];
  const updatedStadium = state.stadiums[updatedTeam.stadiumId];

  updatedStadium.capacity += seatsAdded;
  updatedFacility.stadiumUpgradeLevel += 1;
  updatedFinance.currentCash -= upgradeCost;
  updatedFinance.facilityUpkeepMonthly += seatsAdded * economyConfig.stadiumExpansionUpkeepPerSeatMonthly;
  updatedTeam.cash = updatedFinance.currentCash;

  state.meta.updatedAt = new Date().toISOString();
  state.eventLog.push({
    id: `event_${state.eventLog.length + 1}`,
    timestamp: state.meta.updatedAt,
    actionType: "EXPAND_STADIUM_CAPACITY",
    actorTeamId: teamId,
    payload: {
      stadiumId: updatedStadium.id,
      seatsAdded,
      upgradeCost,
      newCapacity: updatedStadium.capacity,
      stadiumUpgradeLevel: updatedFacility.stadiumUpgradeLevel,
    },
    summary: `${updatedTeam.nickname} expanded ${updatedStadium.name} by ${seatsAdded} seats for $${upgradeCost.toLocaleString()}.`,
  });

  state.mailbox.messages.unshift({
    id: `mail_stadium_${state.eventLog.length}`,
    date: state.world.currentDate,
    sender: "Operations Director",
    subject: "Stadium expansion approved",
    body: `${updatedStadium.name} capacity increased to ${updatedStadium.capacity.toLocaleString()} seats. Monthly upkeep increased by $${(seatsAdded * economyConfig.stadiumExpansionUpkeepPerSeatMonthly).toLocaleString()}.`,
    category: "story",
    isRead: false,
    relatedEntityId: updatedStadium.id,
  });
  state.mailbox.unreadCount = state.mailbox.messages.filter((message) => !message.isRead).length;

  return state;
}
