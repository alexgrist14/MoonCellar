import type { IAddGameRequest } from "@mooncellar/schemas";

export interface ISteamAppDetails {
  type?: string;
  name: string;
  short_description?: string;
  developers?: string[];
  publishers?: string[];
  website?: string | null;
  platforms?: { windows?: boolean; mac?: boolean; linux?: boolean };
  genres?: { description: string }[];
  categories?: { description: string }[];
  release_date?: { coming_soon?: boolean; date?: string };
  header_image?: string;
  screenshots?: { path_full: string }[];
}

const GENRES: Record<string, string> = {
  Adventure: "Adventure",
  Indie: "Indie",
  Racing: "Racing",
  RPG: "Role-playing (RPG)",
  Simulation: "Simulator",
  Sports: "Sport",
  Strategy: "Strategy",
};

const MODES: Record<string, string> = {
  "Single-player": "Single player",
  "Multi-player": "Multiplayer",
  "Online PvP": "Multiplayer",
  "LAN PvP": "Multiplayer",
  "Co-op": "Co-operative",
  "Online Co-op": "Co-operative",
  "LAN Co-op": "Co-operative",
  "Shared/Split Screen": "Split screen",
  "Shared/Split Screen Co-op": "Split screen",
  MMO: "Massively Multiplayer Online (MMO)",
};

export const STEAM_PLATFORM_SLUGS = {
  windows: "win",
  mac: "mac",
  linux: "linux",
} as const;

const SCREENSHOTS_LIMIT = 10;

export const decodeHtml = (value: string) =>
  value
    .replace(/<[^>]+>/g, "")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .trim();

export const parseSteamDate = (value?: string) => {
  if (!value) return null;

  const time = Date.parse(`${value.replace(",", "")} UTC`);

  return Number.isNaN(time) ? null : Math.floor(time / 1000);
};

const unique = (values: (string | undefined)[]) => [
  ...new Set(values.filter((value): value is string => !!value)),
];

export const buildSteamGamePayload = (
  appId: number,
  details: ISteamAppDetails,
  {
    slug,
    platformIdBySlug,
    cover,
    hero,
  }: {
    slug: string;
    platformIdBySlug: Map<string, string>;
    cover: string | null;
    hero: string | null;
  }
): IAddGameRequest => {
  const developers = details.developers ?? [];
  const publishers = details.publishers ?? [];
  const companies = unique([...developers, ...publishers]).map((name) => ({
    name,
    developer: developers.includes(name),
    publisher: publishers.includes(name),
    porting: false,
    supporting: false,
  }));
  const platformIds = (
    Object.keys(STEAM_PLATFORM_SLUGS) as (keyof typeof STEAM_PLATFORM_SLUGS)[]
  )
    .filter((key) => details.platforms?.[key])
    .map((key) => platformIdBySlug.get(STEAM_PLATFORM_SLUGS[key]))
    .filter((id): id is string => !!id);
  const screenshots = (details.screenshots ?? [])
    .map(({ path_full }) => path_full)
    .slice(0, SCREENSHOTS_LIMIT);

  return {
    name: details.name.trim(),
    slug,
    type: "Main Game",
    cover,
    summary: details.short_description
      ? decodeHtml(details.short_description)
      : null,
    genres: unique(
      (details.genres ?? []).map(({ description }) => GENRES[description])
    ),
    modes: unique(
      (details.categories ?? []).map(({ description }) => MODES[description])
    ),
    companies,
    first_release: parseSteamDate(details.release_date?.date),
    platformIds,
    screenshots,
    artworks: hero ? [hero] : [],
    backgroundImage: hero,
    websites: details.website ? [details.website] : [],
    externalPages: [
      {
        name: "Steam",
        uid: String(appId),
        url: `https://store.steampowered.com/app/${appId}`,
      },
    ],
    steam: {
      appId,
      name: details.name.trim(),
      updatedAt: new Date().toISOString(),
    },
  } as IAddGameRequest;
};
