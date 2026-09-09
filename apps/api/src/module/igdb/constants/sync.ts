export const IGDB_GAMES_SYNC_CRON = "0 4 * * *";
export const IGDB_GAMES_SYNC_CRON_OPTIONS = {
  name: "igdb-games-sync-updated",
  timeZone: "Europe/Moscow",
};
export const IGDB_GAMES_SYNC_UPDATED_LIMIT = 50;
export const IGDB_GAMES_SYNC_UPDATED_DELAY_MS = 2000;
export const IGDB_GAMES_SYNC_TO_GAMES_CONCURRENCY = 2;

export const IGDB_GAMES_LINK_RELATED_CRON = "30 4 * * *";
export const IGDB_GAMES_LINK_RELATED_CRON_OPTIONS = {
  name: "igdb-games-link-related",
  timeZone: "Europe/Moscow",
};

export const IGDB_CHARACTERS_SYNC_CRON = "0 6 * * *";
export const IGDB_CHARACTERS_SYNC_CRON_OPTIONS = {
  name: "igdb-characters-sync-updated",
  timeZone: "Europe/Moscow",
};
export const IGDB_CHARACTERS_SYNC_UPDATED_LIMIT = 50;
export const IGDB_CHARACTERS_SYNC_UPDATED_DELAY_MS = 2000;
export const IGDB_CHARACTERS_SYNC_TO_CHARACTERS_CONCURRENCY = 2;

export const IGDB_CHARACTERS_LINK_GAMES_CRON = "30 6 * * *";
export const IGDB_CHARACTERS_LINK_GAMES_CRON_OPTIONS = {
  name: "igdb-characters-link-games",
  timeZone: "Europe/Moscow",
};
