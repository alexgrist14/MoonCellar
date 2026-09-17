import { z } from "zod";
import { CommunityAuthorSchema } from "./comments.schema";
import { ObjectIdSchema } from "./utils";

export const CUSTOM_LIST_NAME_MIN = 3;
export const CUSTOM_LIST_NAME_MAX = 60;
export const CUSTOM_LIST_DESCRIPTION_MAX = 300;
export const CUSTOM_LISTS_PER_USER_MAX = 50;
export const CUSTOM_LIST_GAMES_MAX = 500;
export const CUSTOM_LISTS_PAGE_SIZE = 24;
export const CUSTOM_LIST_GAMES_PAGE_SIZE = 30;
export const CUSTOM_LIST_PREVIEW_COVERS = 5;

export const CustomListsSortSchema = z.enum([
  "popular",
  "updatedAt",
  "createdAt",
  "gamesCount",
  "name",
]);
export const CustomListsOrderSchema = z.enum(["asc", "desc"]);
export const CustomListsUpdatedSchema = z.enum(["week", "month", "year"]);
export const CustomListsGamesModeSchema = z.enum(["any", "all"]);
export const CustomListGamePositionSchema = z.enum(["start", "end"]);

export const CustomListNameSchema = z
  .string()
  .trim()
  .min(CUSTOM_LIST_NAME_MIN)
  .max(CUSTOM_LIST_NAME_MAX)
  .describe("List name");

export const CustomListDescriptionSchema = z
  .string()
  .trim()
  .max(CUSTOM_LIST_DESCRIPTION_MAX)
  .describe("List description");

export const CustomListGameSchema = z.object({
  gameId: z.string().describe("Game id"),
  addedAt: z.string().describe("Date the game was added"),
});

export const CustomListSchema = z.object({
  _id: z.string().describe("List id"),
  userId: z.string().describe("Owner id"),
  name: z.string().describe("List name"),
  slug: z.string().describe("Current slug, unique per owner"),
  description: z.string().describe("List description"),
  isPrivate: z.boolean().describe("Visible to the owner only"),
  gamesCount: z.number().describe("Games in the list"),
  likesCount: z.number().describe("Likes from other players"),
  isLiked: z
    .boolean()
    .optional()
    .describe("The signed-in viewer liked the list"),
  covers: z
    .string()
    .array()
    .describe("Covers of the first games, in list order"),
  author: CommunityAuthorSchema.nullable().describe("Owner"),
  containsGame: z
    .boolean()
    .optional()
    .describe("The game from the request is in the list"),
  createdAt: z.string().describe("Creation date"),
  updatedAt: z.string().describe("Last update date"),
});

export const CustomListDetailsSchema = CustomListSchema.extend({
  games: CustomListGameSchema.array().describe("Games in list order"),
});

export const CreateCustomListRequestSchema = z.object({
  name: CustomListNameSchema,
  description: CustomListDescriptionSchema.optional(),
  isPrivate: z.boolean().default(false),
  gameId: ObjectIdSchema.optional().describe("Game to add right away"),
});

export const UpdateCustomListRequestSchema = z.object({
  name: CustomListNameSchema.optional(),
  description: CustomListDescriptionSchema.optional(),
  isPrivate: z.boolean().optional(),
});

export const AddCustomListGameRequestSchema = z.object({
  gameId: ObjectIdSchema,
  position: CustomListGamePositionSchema.default("end"),
});

export const ReorderCustomListRequestSchema = z.object({
  gameIds: ObjectIdSchema.array().max(CUSTOM_LIST_GAMES_MAX),
});

export const GetCustomListsRequestSchema = z.object({
  search: z.string().trim().max(100).optional().describe("Name or description"),
  author: z.string().trim().max(15).optional().describe("Author user name"),
  games: z
    .union([ObjectIdSchema.array(), z.string()])
    .transform((value) =>
      (Array.isArray(value) ? value : value.split(","))
        .map((id) => id.trim())
        .filter(Boolean)
    )
    .pipe(ObjectIdSchema.array().max(20))
    .optional()
    .describe("Game ids the list contains"),
  gamesMode: CustomListsGamesModeSchema.default("any"),
  minGames: z.coerce.number().int().min(1).optional(),
  updated: CustomListsUpdatedSchema.optional(),
  sortBy: CustomListsSortSchema.default("popular"),
  sortOrder: CustomListsOrderSchema.default("desc"),
  page: z.coerce.number().int().min(1).default(1),
  take: z.coerce.number().int().min(1).max(50).default(CUSTOM_LISTS_PAGE_SIZE),
});

export const GetCustomListsResponseSchema = z.object({
  results: CustomListSchema.array(),
  total: z.number(),
});

export const GetUserCustomListsRequestSchema = z.object({
  gameId: ObjectIdSchema.optional().describe("Mark lists containing the game"),
});

export const GetUserCustomListsResponseSchema = CustomListSchema.array();

export const GetCustomListBySlugRequestSchema = z.object({
  userName: z.string().min(3).max(15),
  slug: z.string().min(1).max(80),
});

export const CustomListLikeResponseSchema = z.object({
  likesCount: z.number().describe("Likes after the change"),
  isLiked: z.boolean().describe("Whether the viewer's like is set"),
});

export const CustomListGameCountsResponseSchema = z.record(
  z.string(),
  z.number()
);

export type ICustomListsSort = z.infer<typeof CustomListsSortSchema>;
export type ICustomListsOrder = z.infer<typeof CustomListsOrderSchema>;
export type ICustomListsUpdated = z.infer<typeof CustomListsUpdatedSchema>;
export type ICustomListsGamesMode = z.infer<typeof CustomListsGamesModeSchema>;
export type ICustomListGamePosition = z.infer<
  typeof CustomListGamePositionSchema
>;
export type ICustomListGame = z.infer<typeof CustomListGameSchema>;
export type ICustomList = z.infer<typeof CustomListSchema>;
export type ICustomListDetails = z.infer<typeof CustomListDetailsSchema>;
export type ICreateCustomListRequest = z.input<
  typeof CreateCustomListRequestSchema
>;
export type IUpdateCustomListRequest = z.infer<
  typeof UpdateCustomListRequestSchema
>;
export type IAddCustomListGameRequest = z.input<
  typeof AddCustomListGameRequestSchema
>;
export type IReorderCustomListRequest = z.infer<
  typeof ReorderCustomListRequestSchema
>;
export type IGetCustomListsRequest = z.input<
  typeof GetCustomListsRequestSchema
>;
export type IGetCustomListsQuery = z.output<typeof GetCustomListsRequestSchema>;
export type IGetCustomListsResponse = z.infer<
  typeof GetCustomListsResponseSchema
>;
export type IGetUserCustomListsRequest = z.infer<
  typeof GetUserCustomListsRequestSchema
>;
export type IGetCustomListBySlugRequest = z.infer<
  typeof GetCustomListBySlugRequestSchema
>;
export type ICustomListLikeResponse = z.infer<
  typeof CustomListLikeResponseSchema
>;
export type ICustomListGameCountsResponse = z.infer<
  typeof CustomListGameCountsResponseSchema
>;
