import { GameState } from "../types/gameState";

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

export function markMailRead(input: GameState, messageId: string): GameState {
  const state = clone(input);
  const message = state.mailbox.messages.find((item) => item.id === messageId);
  if (!message) {
    throw new Error(`Message ${messageId} not found.`);
  }

  if (!message.isRead) {
    message.isRead = true;
    state.mailbox.unreadCount = state.mailbox.messages.filter((item) => !item.isRead).length;
    state.meta.updatedAt = new Date().toISOString();
    state.eventLog.push({
      id: `event_${state.eventLog.length + 1}`,
      timestamp: state.meta.updatedAt,
      actionType: "MARK_MESSAGE_READ",
      payload: { messageId },
      summary: `Read mailbox message ${message.subject}.`,
    });
  }

  return state;
}
