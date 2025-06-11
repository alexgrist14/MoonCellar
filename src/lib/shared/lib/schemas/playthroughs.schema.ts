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
  gameId: z.coerce.number().min(0).describe("Game id"),
  platformId: z.number().describe("Platform id").optional(),
  releaseDateId: z.number().describe("Release date id").optional(),
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
});

export const PlaythoughFullResponseSchema = PlaythroughSchema;
export const PlaythoughMinimalResponseSchema = PlaythroughSchema.pick({
  _id: true,
  category: true,
  gameId: true,
  isMastered: true,
});
export const PlaythoughsResponseSchema = PlaythoughFullResponseSchema.array();
export const PlaythoughsMinimalResponseSchema =
  PlaythoughMinimalResponseSchema.array();
export const GetPlaythroughsRequestSchema = PlaythroughSchema.omit({
  _id: true,
})
  .extend({ page: z.number(), take: z.number() })
  .partial();
export const SavePlaythroughRequestSchema = PlaythroughSchema.omit({
  _id: true,
});
export const UpdatePlaythroughRequestSchema = PlaythroughSchema.omit({
  _id: true,
  gameId: true,
  userId: true,
});

export type IPlaythrough = z.infer<typeof PlaythoughFullResponseSchema>;
export type IPlaythroughMinimal = z.infer<
  typeof PlaythoughMinimalResponseSchema
>;
export type IGetPlaythroughsResponse = z.infer<
  typeof PlaythoughsResponseSchema
>;
export type IGetPlaythroughsMinimalResponse = z.infer<
  typeof PlaythoughsMinimalResponseSchema
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
