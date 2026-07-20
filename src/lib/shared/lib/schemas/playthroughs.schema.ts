import { z } from "zod";

export const categoriesZod = z.enum([
  "completed",
  "wishlist",
  "dropped",
  "playing",
  "backlog",
  "played",
]);

export const PlaythroughSchema = z.object({
  _id: z.string().nonempty().describe("Playthrough id"),
  userId: z.string().nonempty().describe("User id"),
  gameId: z.string().min(0).describe("Game id"),
  platformId: z.string().describe("Platform id").optional(),
  category: categoriesZod.describe(`Category}`),
  date: z
    .string()
    .date()
    .nullish()
    .or(z.string().max(0))
    .describe("Finish date")
    .optional(),
  time: z.coerce.number().describe("Spent time (hours)").optional(),
  comment: z.string().describe("Note after complete").optional(),
  isMastered: z.boolean().describe("Check if mastered").optional(),
  createdAt: z.coerce.string().date(),
  updatedAt: z.coerce.string().date(),
});

export const PlaythroughEditSchema = PlaythroughSchema.omit({
  _id: true,
  createdAt: true,
  updatedAt: true,
});

export const PlaythroughFullResponseSchema = PlaythroughSchema;
export const PlaythroughMinimalResponseSchema = PlaythroughSchema.pick({
  _id: true,
  category: true,
  gameId: true,
  isMastered: true,
  updatedAt: true,
});
export const PlaythroughsResponseSchema = PlaythroughFullResponseSchema.array();
export const PlaythroughsMinimalResponseSchema =
  PlaythroughMinimalResponseSchema.array();
export const GetPlaythroughsRequestSchema = PlaythroughEditSchema.partial();
export const SavePlaythroughRequestSchema = PlaythroughEditSchema.omit({});
export const UpdatePlaythroughRequestSchema = PlaythroughEditSchema.omit({
  gameId: true,
  userId: true,
});

export type IPlaythrough = z.infer<typeof PlaythroughFullResponseSchema>;
export type IPlaythroughMinimal = z.infer<
  typeof PlaythroughMinimalResponseSchema
>;
export type IGetPlaythroughsResponse = z.infer<
  typeof PlaythroughsResponseSchema
>;
export type IGetPlaythroughsMinimalResponse = z.infer<
  typeof PlaythroughsMinimalResponseSchema
>;

export type IGetPlaythroughsRequest = z.infer<
  typeof GetPlaythroughsRequestSchema
>;
export type ISavePlaythroughRequest = z.infer<
  typeof SavePlaythroughRequestSchema
>;
export type IUpdatePlaythroughRequest = z.infer<
  typeof UpdatePlaythroughRequestSchema
>;
