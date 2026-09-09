export const HLTB_SYNC_CRON = "0 5 * * 0";
export const HLTB_SYNC_CRON_OPTIONS = {
  name: "hltb-weekly-sync",
  timeZone: "Europe/Moscow",
};

export const HLTB_DEFAULT_BATCH_SIZE = 50;
export const HLTB_DEFAULT_DELAY_MS = 1500;

/** Cron limits for low-resource hosts (e.g. Raspberry Pi). */
export const HLTB_CRON_MAX_GAMES = 30000;
export const HLTB_CRON_DELAY_MS = 3000;
export const HLTB_STALE_DAYS = 30;
export const HLTB_NOT_FOUND_RETRY_DAYS = 90;

/**
 * Minimum order-independent token-set similarity for a title to count as a
 * "strong" match. Combined with a platform/year corroboration check, this
 * keeps unrelated games (e.g. a different "The Incredible Hulk") from being
 * accepted. Tuned so reordered titles ("A: B" vs "B: A") still score 1.0.
 */
export const HLTB_STRONG_TITLE_SIMILARITY = 0.85;

/** Pause between fallback search queries for the same game, in milliseconds. */
export const HLTB_QUERY_DELAY_MS = 400;
