import { GameState } from "../types/gameState";

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

export function setTicketPrice(input: GameState, teamId: string, ticketPrice: number): GameState {
  const normalizedPrice = Math.round(ticketPrice);
  if (normalizedPrice < 5 || normalizedPrice > 35) {
    throw new Error("Ticket price must be between $5 and $35.");
  }

  const finance = input.finances[teamId];
  if (!finance) {
    throw new Error(`Finance state not found for team ${teamId}.`);
  }

  const state = clone(input);
  state.finances[teamId].ticketPrice = normalizedPrice;
  state.meta.updatedAt = new Date().toISOString();
  state.eventLog.push({
    id: `event_${state.eventLog.length + 1}`,
    timestamp: state.meta.updatedAt,
    actionType: "SET_TICKET_PRICE",
    actorTeamId: teamId,
    payload: { ticketPrice: normalizedPrice },
    summary: `${state.teams[teamId].nickname} set ticket price to $${normalizedPrice}.`,
  });
  return state;
}
