import { z } from "zod";

export const SaveMetaSchema = z.object({
  schemaVersion: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
  gameVersion: z.string(),
  saveName: z.string(),
});

export const GameStateSchema = z.object({
  meta: SaveMetaSchema,
  rng: z.object({
    seed: z.string(),
    step: z.number(),
  }),
  world: z.object({
    currentDate: z.string(),
    currentSeason: z.number(),
    currentWeek: z.number(),
    currentPhase: z.enum(["preseason", "regularSeason", "playoffs", "offseason"]),
    userTeamId: z.string(),
    difficulty: z.enum(["easy", "normal", "hard", "sim"]),
    currency: z.string(),
  }),
  leagues: z.record(z.any()),
  teams: z.record(z.any()),
  players: z.record(z.any()),
  stadiums: z.record(z.any()),
  schedule: z.record(z.any()),
  standings: z.record(z.any()),
  finances: z.record(z.any()),
  mailbox: z.object({
    messages: z.array(z.any()),
    unreadCount: z.number(),
  }),
  eventLog: z.array(z.any()),
});
