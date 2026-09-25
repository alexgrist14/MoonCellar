import { z } from "zod";
import { CharacterSchema } from "./characters.schema";
import { RaAwardSchema } from "./ra.schema";
import { RoleSchema } from "./role.schema";
import { ObjectIdSchema } from "./utils";

export const DEFAULT_BG_OPACITY = 0.85;
export const FAVORITES_MAX = 10;
export const USERS_SEARCH_PAGE_SIZE = 10;

export const UserSettingsSchema = z.object({
  showAdultContent: z.boolean(),
  bgOpacity: z.number().min(0).max(1).default(DEFAULT_BG_OPACITY),
});

export const UserSchemaZod = z.object({
  _id: z.string(),
  userName: z
    .string()
    .min(3)
    .max(15)
    .regex(/^[a-zA-Z0-9_]+$/),
  email: z.string().email(),
  password: z.string().min(8).max(100),
  refreshToken: z.string().jwt().nullable(),
  followings: z.array(z.string()),
  followers: z.array(z.string()),
  favorites: z.array(z.string()).max(FAVORITES_MAX),
  favoriteCharacters: z.array(z.string()).optional(),
  filters: z.array(z.object({ name: z.string(), filter: z.string() })),
  presets: z.array(z.object({ name: z.string(), preset: z.string() })),
  description: z.string().max(450).nullable(),
  raUsername: z.string().nullable(),
  raAwards: RaAwardSchema.array(),
  roles: RoleSchema.array().default(["user"]),
  avatar: z.string().url().nullable(),
  background: z.string().url().nullable(),
  settings: UserSettingsSchema.default({
    showAdultContent: false,
    bgOpacity: DEFAULT_BG_OPACITY,
  }),
  updatedAt: z.date(),
});

export const GetUserByStringSchema = z.object({
  searchString: z.union([
    z.string().email(),
    z
      .string()
      .min(3)
      .max(15)
      .regex(/^[a-zA-Z0-9_]+$/),
  ]),
});
export const GetUserByIdSchema = UserSchemaZod.pick({ _id: true });
export const UpdateUserEmailSchema = UserSchemaZod.pick({ email: true });
export const UpdateUserPasswordSchema = z.object({
  oldPassword: z.string().min(8).max(100),
  newPassword: z.string().min(8).max(100),
});
export const UpdateDescriptionSchema = UserSchemaZod.pick({
  description: true,
});
export const UpdateSettingsSchema = UserSettingsSchema.partial();

export const UpdateFavoritesRequestSchema = z.object({
  gameIds: ObjectIdSchema.array()
    .max(FAVORITES_MAX)
    .refine((ids) => new Set(ids).size === ids.length, "Duplicate games")
    .describe("Favourite game ids in the owner's order"),
});

export const UpdateFavoritesResponseSchema = z.object({
  favorites: z.string().array(),
});

export const AddFavoriteRequestSchema = z.object({
  replaceGameId: ObjectIdSchema.optional().describe(
    "Favourite game to swap out for the added one"
  ),
});

export const UpdateFavoriteCharactersRequestSchema = z.object({
  characterIds: ObjectIdSchema.array()
    .refine((ids) => new Set(ids).size === ids.length, "Duplicate characters")
    .describe("Favourite character ids in the owner's order"),
});

export const UpdateFavoriteCharactersResponseSchema = z.object({
  favoriteCharacters: z.string().array(),
});

export const GetFavoriteCharactersResponseSchema = CharacterSchema.array();

export const SearchUsersRequestSchema = z.object({
  q: z.string().trim().min(2).max(15).describe("Part of a user name"),
  page: z.coerce.number().int().min(1).default(1),
  take: z.coerce.number().int().min(1).max(30).default(USERS_SEARCH_PAGE_SIZE),
});

export const SearchUserResultSchema = z.object({
  _id: z.string(),
  userName: z.string(),
  avatar: z.string().optional(),
  updatedAt: z.string(),
  gamesCount: z.number(),
  followersCount: z.number(),
  favoriteCovers: z.string().array(),
  isFollowedByViewer: z.boolean(),
  followsViewer: z.boolean(),
});

export const SearchUsersResponseSchema = z.object({
  results: SearchUserResultSchema.array(),
  total: z.number(),
});

export const GetUserLoginsResponseSchema = z
  .object({ userName: z.string(), updatedAt: z.string() })
  .array();

export type IUser = z.infer<typeof UserSchemaZod>;
export type IUserSettings = z.infer<typeof UserSettingsSchema>;
export type IGetUserByStringRequest = z.infer<typeof GetUserByStringSchema>;
export type IGetUserByIdRequest = z.infer<typeof GetUserByIdSchema>;
export type IUpdateUserEmailRequest = z.infer<typeof UpdateUserEmailSchema>;
export type IUpdateUserPasswordRequest = z.infer<
  typeof UpdateUserPasswordSchema
>;
export type IUpdateUserDescriptionRequest = z.infer<
  typeof UpdateDescriptionSchema
>;
export type IUpdateUserSettingsRequest = z.infer<typeof UpdateSettingsSchema>;
export type IUpdateFavoritesRequest = z.infer<
  typeof UpdateFavoritesRequestSchema
>;
export type IUpdateFavoritesResponse = z.infer<
  typeof UpdateFavoritesResponseSchema
>;
export type IAddFavoriteRequest = z.infer<typeof AddFavoriteRequestSchema>;
export type IUpdateFavoriteCharactersRequest = z.infer<
  typeof UpdateFavoriteCharactersRequestSchema
>;
export type IUpdateFavoriteCharactersResponse = z.infer<
  typeof UpdateFavoriteCharactersResponseSchema
>;
export type IGetFavoriteCharactersResponse = z.infer<
  typeof GetFavoriteCharactersResponseSchema
>;
export type ISearchUsersRequest = z.input<typeof SearchUsersRequestSchema>;
export type ISearchUsersQuery = z.output<typeof SearchUsersRequestSchema>;
export type ISearchUserResult = z.infer<typeof SearchUserResultSchema>;
export type ISearchUsersResponse = z.infer<typeof SearchUsersResponseSchema>;
export type IGetUserLoginsResponse = z.infer<
  typeof GetUserLoginsResponseSchema
>;
