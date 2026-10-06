import { z } from "zod";
import {
  CustomListGamesFiltersSchema,
  CustomListsOrderSchema,
} from "./custom-lists.schema";
import { SteamAccountSchema } from "./user.schema";

export const STEAM_LIBRARY_SORTS = [
  "achievements",
  "playtime",
  "name",
  "release",
  "rating",
] as const;
export const DEFAULT_STEAM_LIBRARY_SORT = "achievements";
export const DEFAULT_STEAM_LIBRARY_ORDER = "desc";

export const SteamLibrarySortSchema = z.enum(STEAM_LIBRARY_SORTS);

export const SteamLoginUrlResponseSchema = z.object({
  url: z.string().describe("Steam sign-in page to send the browser to"),
});

export const LinkSteamAccountRequestSchema = z.object({
  params: z
    .record(z.string(), z.string())
    .describe("The openid.* query parameters Steam returned to the site"),
});

export const SteamSyncResponseSchema = z.object({
  steam: SteamAccountSchema,
  ownedCount: z.number().describe("Games the Steam account owns"),
  matchedCount: z.number().describe("Owned games found in the catalogue"),
  unmatched: z
    .object({
      appId: z.number().describe("Steam app id"),
      name: z.string().describe("Name on Steam"),
    })
    .array()
    .describe("Owned games that are not in the catalogue, most played first"),
});

export const UnlinkSteamAccountResponseSchema = z.object({
  isUnlinked: z.boolean(),
});

export const SteamLibraryGameSchema = z.object({
  gameId: z.string().describe("Catalogue game"),
  appId: z.number().describe("Steam app"),
  playtime: z.number().describe("Minutes played on Steam"),
  unlocked: z
    .number()
    .nullable()
    .describe("Achievements the user unlocked, null without progress"),
  total: z.number().nullable().describe("Achievements in the app"),
  masteredAt: z.string().nullable(),
});

export const GetSteamLibraryRequestSchema = z.object({
  userName: z.string().min(3).max(15),
  sortBy: SteamLibrarySortSchema.optional(),
  sortOrder: CustomListsOrderSchema.optional(),
  filters: CustomListGamesFiltersSchema.optional().describe(
    "Catalogue filters applied to the library"
  ),
});

export const GetSteamLibraryResponseSchema = z.object({
  games: SteamLibraryGameSchema.array().describe(
    "Owned games found in the catalogue, filtered and sorted"
  ),
  total: z.number().describe("Owned games in the catalogue, unfiltered"),
});

export type ISteamLoginUrlResponse = z.infer<
  typeof SteamLoginUrlResponseSchema
>;
export type ILinkSteamAccountRequest = z.infer<
  typeof LinkSteamAccountRequestSchema
>;
export type ISteamSyncResponse = z.infer<typeof SteamSyncResponseSchema>;
export type IUnlinkSteamAccountResponse = z.infer<
  typeof UnlinkSteamAccountResponseSchema
>;
export type ISteamLibrarySort = z.infer<typeof SteamLibrarySortSchema>;
export type ISteamLibraryGame = z.infer<typeof SteamLibraryGameSchema>;
export type IGetSteamLibraryRequest = z.infer<
  typeof GetSteamLibraryRequestSchema
>;
export type IGetSteamLibraryResponse = z.infer<
  typeof GetSteamLibraryResponseSchema
>;
