export const RA_GAMES_FETCH_DELAY_MS = 400;
export const RA_AWARDS_FETCH_DELAY_MS = 400;
export const RA_NAME_MATCH_THRESHOLD = 0.3;
export const RA_AMBIGUITY_GAP = 0.05;
export const RA_CONFLICT_CANDIDATES_LIMIT = 5;

export const RA_SYNC_CRON = "0 4 * * *";
export const RA_SYNC_CRON_OPTIONS = {
  name: "ra-sync-daily",
  timeZone: "Europe/Moscow",
};
