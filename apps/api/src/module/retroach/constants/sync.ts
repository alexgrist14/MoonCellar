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

export const RA_CONSOLE_BY_PLATFORM_SLUG: Record<string, number> = {
  "64dd": 2,
  satellaview: 3,
  famicom: 7,
  supergrafx: 8,
  "neo-geo-pocket-color": 14,
  "pokemon-mini": 24,
  msx2: 29,
  c64: 30,
  "sinclair-zx81": 31,
  "pc-8800-series": 47,
  "pc-9800-series": 48,
  "wonderswan-color": 53,
  swancrystal: 53,
  "epoch-cassette-vision": 54,
  "epoch-super-cassette-vision": 55,
  ngage: 61,
  "watara-slash-quickshot-supervision": 63,
  "nec-pc-6000-series": 67,
  "vc-4000": 74,
  fds: 81,
};
