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
