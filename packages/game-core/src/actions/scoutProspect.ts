import { GameState, Player, ProspectReport } from "../types/gameState";
import { nextSeededValue } from "../utils/rng";

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function nextRoll(state: GameState) {
  const value = nextSeededValue(state.rng.seed, state.rng.step);
  state.rng.step += 1;
  return value;
}

function isScoutableProspect(player: Player) {
  return !player.currentTeamId && player.status === "freeAgent" && player.age <= 24;
}

function buildScoutingNotes(player: Player, estimatedOverall: number, estimatedPotential: number) {
  const notes: string[] = [];
  if (player.primaryPosition === "SP" || player.primaryPosition === "RP") {
    const velocity = player.ratings.pitching?.velocity ?? 0;
    const movement = player.ratings.pitching?.movement ?? 0;
    notes.push(velocity >= 70 ? "Lively fastball already plays." : "Velocity is modest but usable.");
    notes.push(movement >= 68 ? "Breaking ball profile should miss bats." : "Needs sharper secondary stuff.");
  } else {
    notes.push(player.ratings.hitting.contact >= 68 ? "Barrel control stands out." : "Bat still needs polish.");
    notes.push(player.ratings.defense.fielding >= 65 ? "Glove gives him a path to the field." : "Defense may take time to settle.");
  }

  notes.push(estimatedPotential >= 78 ? "Scouts see real long-term upside." : "Projection is steadier than flashy.");
  if (player.personality.workEthic >= 70) {
    notes.push("Work ethic grades well in background checks.");
  }

  return notes.slice(0, 3);
}

export function scoutProspect(input: GameState, teamId: string, playerId: string): GameState {
  const state = clone(input);
  const team = state.teams[teamId];
  if (!team) {
    throw new Error("Team not found.");
  }

  const player = state.players[playerId];
  if (!player) {
    throw new Error("Player not found.");
  }
  if (!isScoutableProspect(player)) {
    throw new Error("This player is not in the amateur scouting pool.");
  }

  const department = state.scouting[teamId];
  const officeLevel = state.facilities[teamId]?.scoutingOfficeLevel ?? 1;
  const accuracy = department?.scoutingAccuracy ?? 40;
  const variance = Math.max(3, Math.round(16 - (accuracy / 9) - (officeLevel * 2)));
  const overallOffset = Math.round((nextRoll(state) - 0.5) * variance * 2);
  const potentialOffset = Math.round((nextRoll(state) - 0.5) * Math.max(2, variance - 1) * 2);
  const scoutedOverallEstimate = clamp(player.overall + overallOffset, 20, 99);
  const scoutedPotentialEstimate = clamp(player.potential + potentialOffset, scoutedOverallEstimate, 99);
  const confidence = clamp(Math.round(42 + (accuracy * 0.4) + (officeLevel * 8) + (nextRoll(state) * 10)), 35, 95);
  const notes = buildScoutingNotes(player, scoutedOverallEstimate, scoutedPotentialEstimate);

  const report: ProspectReport = {
    playerId,
    scoutedOverallEstimate,
    scoutedPotentialEstimate,
    confidence,
    notes,
    lastScoutedDate: state.world.currentDate,
  };

  department.prospectBoard = [
    report,
    ...department.prospectBoard.filter((existing) => existing.playerId !== playerId),
  ].sort((left, right) => right.scoutedPotentialEstimate - left.scoutedPotentialEstimate || right.scoutedOverallEstimate - left.scoutedOverallEstimate);

  state.mailbox.messages.unshift({
    id: `mail_scout_${teamId}_${playerId}_${state.world.currentWeek}`,
    date: state.world.currentDate,
    sender: "Scouting Department",
    subject: `Scouting report: ${player.fullName}`,
    body: `${player.fullName} (${player.primaryPosition}) comes in around ${scoutedOverallEstimate} OVR / ${scoutedPotentialEstimate} POT. ${notes.join(" ")}`,
    category: "staff",
    isRead: false,
    relatedEntityId: playerId,
  });
  state.mailbox.unreadCount = state.mailbox.messages.filter((message) => !message.isRead).length;
  state.eventLog.push({
    id: `event_${state.eventLog.length + 1}`,
    timestamp: new Date().toISOString(),
    actionType: "SCOUT_PROSPECT",
    actorTeamId: teamId,
    actorPlayerId: playerId,
    payload: { playerId, scoutedOverallEstimate, scoutedPotentialEstimate, confidence },
    summary: `${team.nickname} scouted ${player.fullName}.`,
  });
  state.meta.updatedAt = new Date().toISOString();
  return state;
}
