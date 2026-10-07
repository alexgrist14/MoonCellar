import { z } from "zod";
import { ObjectIdSchema } from "./utils";

export const GAUNTLET_HISTORY_LIMIT = 1000;
export const GAUNTLET_HISTORY_TAKE = 6;

export const GetGauntletHistorySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  take: z.coerce.number().int().min(1).max(100).default(GAUNTLET_HISTORY_TAKE),
});

export const AddGauntletHistorySchema = z.object({
  gameIds: ObjectIdSchema.array()
    .min(1)
    .max(GAUNTLET_HISTORY_LIMIT)
    .describe("Won games, newest first"),
});

export const GauntletHistoryGameParamsSchema = z.object({
  gameId: ObjectIdSchema,
});

export type IGetGauntletHistoryRequest = z.input<
  typeof GetGauntletHistorySchema
>;
export type IAddGauntletHistoryRequest = z.infer<
  typeof AddGauntletHistorySchema
>;
