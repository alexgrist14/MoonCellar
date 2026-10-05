import { z } from "zod";
import { CustomListSchema } from "./custom-lists.schema";
import { SteamAccountSchema } from "./user.schema";

export const STEAM_LIBRARY_LIST_NAME = "Steam library";

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
  list: CustomListSchema.describe("The Steam library list"),
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
  deletedListId: z
    .string()
    .nullable()
    .describe("The Steam library list that was deleted with the link"),
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
