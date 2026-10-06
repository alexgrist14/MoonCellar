import { z } from "zod";

const AwardTypeSchema = z.enum([
  "Achievement Points Yield",
  "Achievement Unlocks Yield",
  "Certified Legend",
  "Game Beaten",
  "Invalid or deprecated award type",
  "Mastery/Completion",
  "Patreon Supporter",
]);

export const RaAwardSchema = z.object({
  awardedAt: z.string(),
  awardType: AwardTypeSchema,
  awardData: z.number(),
  awardDataExtra: z.number(),
  displayOrder: z.number(),
  title: z.string(),
  consoleName: z.string(),
  flags: z.number(),
  imageIcon: z.string().url(),
});

export type IRAAward = z.infer<typeof RaAwardSchema>;

export const RA_CONNECT_CODE_TTL_MINUTES = 30;

export const RaPendingSchema = z.object({
  username: z.string(),
  code: z.string(),
  expiresAt: z.string(),
});

export const RaConnectRequestSchema = z.object({
  username: z
    .string()
    .trim()
    .min(2, "Enter your RetroAchievements username")
    .max(32),
});

export const RaConnectResponseSchema = RaPendingSchema;

export type IRaPending = z.infer<typeof RaPendingSchema>;
export type IRaConnectRequest = z.infer<typeof RaConnectRequestSchema>;
export type IRaConnectResponse = z.infer<typeof RaConnectResponseSchema>;
