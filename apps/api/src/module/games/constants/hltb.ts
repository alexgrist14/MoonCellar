export const HLTB_SYNC_CRON = "0 5 * * 0";
export const HLTB_SYNC_CRON_OPTIONS = {
  name: "hltb-weekly-sync",
  timeZone: "Europe/Moscow",
};

export const HLTB_CATALOG_PAGE_SIZE = 25;
export const HLTB_CATALOG_PAGE_DELAY_MS = 1000;
export const HLTB_CATALOG_RETRY_DELAY_MS = 60_000;
export const HLTB_CATALOG_PAGE_ATTEMPTS = 4;
export const HLTB_CATALOG_TOKEN_REQUESTS = 90;
export const HLTB_CATALOG_MIN_COMPLETENESS = 0.98;
export const HLTB_SYNC_WRITE_BATCH = 500;
export const HLTB_SEARCH_RESULTS_PER_QUERY = 20;
export const HLTB_USER_AGENT =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36";

/**
 * Minimum order-independent token-set similarity for a title to count as a
 * "strong" match. Combined with a platform/year corroboration check, this
 * keeps unrelated games (e.g. a different "The Incredible Hulk") from being
 * accepted. Tuned so reordered titles ("A: B" vs "B: A") still score 1.0.
 */
export const HLTB_STRONG_TITLE_SIMILARITY = 0.85;

/** Pause between fallback search queries for the same game, in milliseconds. */
export const HLTB_QUERY_DELAY_MS = 400;

export const HLTB_CONFLICT_ENTRIES_LIMIT = 5;

export const HLTB_PLATFORM_YEAR_TOLERANCE = 2;

export const HLTB_LOOSE_TITLE_OVERLAP = 0.8;

export const HLTB_ADDON_GAME_TYPES = [
  "DLC",
  "Expansion",
  "Standalone Expansion",
  "Pack / Addon",
  "Episode",
  "Season",
  "Mod",
  "Fan Disc",
];

export const HLTB_ADDON_ENTRY_TYPES = ["dlc", "mod", "hack"];

export const HLTB_PREFERRED_PLATFORM_SLUGS: Record<string, string[]> = {
  pc: ["win"],
  snes: ["snes"],
  nes: ["nes"],
  "nintendo 3ds": ["3ds"],
  mobile: ["ios", "android"],
};

export const HLTB_GAME_TYPES: Record<string, string> = {
  dlc: "DLC",
  mod: "Mod",
  hack: "Mod",
  compil: "Bundle",
};

export const HLTB_WORLDWIDE_REGION = 8;

export const HLTB_RELEASE_REGIONS: Record<string, number> = {
  release_na: 2,
  release_eu: 1,
  release_jp: 5,
};
