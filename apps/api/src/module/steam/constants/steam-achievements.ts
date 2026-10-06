export const STEAM_ACHIEVEMENTS_CRON = "30 3 * * *";
export const STEAM_ACHIEVEMENTS_CRON_OPTIONS = {
  name: "steam-achievements-daily",
  timeZone: "Europe/Moscow",
};

export const STEAM_ACHIEVEMENTS_DAILY_LIMIT = 60000;
export const STEAM_ACHIEVEMENTS_DELAY_MS = 500;
export const STEAM_ACHIEVEMENTS_TIMEOUT_MS = 15000;
export const STEAM_ACHIEVEMENTS_BATCH_SIZE = 200;
export const STEAM_ACHIEVEMENTS_STALE_DAYS = 60;
export const STEAM_ACHIEVEMENTS_MAX_CONSECUTIVE_FAILURES = 10;
