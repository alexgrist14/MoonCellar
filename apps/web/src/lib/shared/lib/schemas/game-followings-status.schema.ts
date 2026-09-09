import { z } from "zod";

export const followingsStatusCategoryZod = z.enum([
  "mastered",
  "completed",
  "playing",
  "played",
  "backlog",
  "wishlist",
  "dropped",
]);

export const GetGameFollowingsStatusRequestSchema = z.object({
  userId: z.string().nonempty().describe("Viewer user id"),
});

export const GameFollowingsStatusItemSchema = z.object({
  userId: z.string().nonempty(),
  userName: z.string().nonempty(),
  avatar: z.string(),
  category: followingsStatusCategoryZod,
  count: z.number().int().min(1),
  rating: z.number().min(1).max(10).nullable(),
});

export const GetGameFollowingsStatusResponseSchema =
  GameFollowingsStatusItemSchema.array();

export type IGetGameFollowingsStatusRequest = z.infer<
  typeof GetGameFollowingsStatusRequestSchema
>;
export type IGameFollowingsStatusItem = z.infer<
  typeof GameFollowingsStatusItemSchema
>;
export type IGetGameFollowingsStatusResponse = z.infer<
  typeof GetGameFollowingsStatusResponseSchema
>;
