import { IExternalPageField } from "src/shared/zod/schemas/games.schema";

const STEAM_APP_URL_REGEX =
  /(?:store\.steampowered\.com|steamcommunity\.com)\/app\/(\d+)(?:\/([^/?#]+))?/i;

export interface SteamAppInfo {
  gameId: number;
  slug?: string;
}

export const extractSteamAppInfo = (url: string): SteamAppInfo | null => {
  const match = url?.match(STEAM_APP_URL_REGEX);
  if (!match) return null;

  const gameId = Number(match[1]);
  const slug = match[2] ? decodeURIComponent(match[2]) : undefined;

  return slug ? { gameId, slug } : { gameId };
};

export const findSteamAppInfo = (websites?: string[]): SteamAppInfo | null => {
  for (const url of websites || []) {
    const info = extractSteamAppInfo(url);
    if (info) return info;
  }

  return null;
};

export const mergeSteamStore = (
  externalPages: IExternalPageField[] | undefined,
  steamInfo: SteamAppInfo
): IExternalPageField[] => [
  ...(externalPages || []).filter((store) => store.name !== "Steam"),
  {
    name: "Steam",
    uid: String(steamInfo.gameId),
    url: `https://store.steampowered.com/app/${steamInfo.gameId}${
      steamInfo.slug ? `/${steamInfo.slug}` : ""
    }`,
  },
];
