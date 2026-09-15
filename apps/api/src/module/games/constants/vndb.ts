export const VNDB_SCORE_THRESHOLD = 2;
export const VNDB_SCORE_GAP = 3;
export const VISUAL_NOVEL_GENRE = "Visual Novel";
export const MAIN_GAME_TYPE = "Main Game";
export const SINGLE_PLAYER_MODE = "Single player";
export const FAN_DISC_GAME_TYPE = "Fan Disc";
export const FAN_DISC_GAME_TYPES = [
  FAN_DISC_GAME_TYPE,
  "Standalone Expansion",
  "Expansion",
  "DLC",
];
export const VNDB_ORIGINAL_RELATION = "orig";
export const VNDB_RELATION_FIELDS: Record<string, string> = {
  seq: "sequels",
  preq: "prequels",
  side: "side_stories",
  par: "parent_stories",
  ser: "same_series",
  set: "same_setting",
  char: "shared_characters",
  alt: "alternative_versions",
  fan: "standalone_expansions",
};
export const VNDB_SHARED_RELATION_FIELDS = ["standalone_expansions"];

export const MIN_STRING_LENGTH = 8;
export const MIN_TITLE_WORDS = 2;

export const VNDB_DISTINCTIVE_TITLE_SCORE = 4;
export const VNDB_STRONG_TITLE_SCORE = 2;
export const VNDB_WEAK_TITLE_SCORE = 1;

export const VNDB_ROLE_COMPANY_SCORE = 2;
export const VNDB_ANY_COMPANY_SCORE = 1;

export const VNDB_DATE_CONFIRMS_SCORE = 3;
export const VNDB_DATE_CONTRADICTS_SCORE = -4;
export const VNDB_DATE_MAX_DIFF_DAYS = 366;

export const VNDB_GENRE_SCORE = 2;
export const VNDB_INCOMPATIBLE_GENRE_SCORE = -3;

export const VNDB_PLATFORM_MATCH_SCORE = 1;
export const VNDB_PLATFORM_MISMATCH_SCORE = -1;

export const VNDB_COMPANY_MISMATCH_SCORE = -1;

export const VNDB_FUZZY_TITLE_SIMILARITY = 0.6;
export const VNDB_FALLBACK_TITLE_SIMILARITY = 0.2;
export const VNDB_FALLBACK_COMPANY_CHUNK_SIZE = 200;
export const MIN_COMPANY_PREFIX_LENGTH = 3;

export const VNDB_DESCRIPTION_SIMILARITY = 0.05;
export const MIN_DESCRIPTION_TOKENS = 12;

export const VNDB_RELEASE_PAGE_SIZE = 100;
export const VNDB_RELEASE_ID_CHUNK_SIZE = 25;
export const VNDB_MAX_RETRIES = 4;
export const VNDB_RETRY_DELAY_MS = 5000;
export const VNDB_REQUEST_DELAY_MS = 1600;
export const VNDB_PAGE_SIZE = 100;
export const VNDB_SYNC_REFRESH_LIMIT = 2000;
export const VNDB_SYNC_CRON = "0 6 * * *";
export const VNDB_SYNC_CRON_OPTIONS = {
  name: "vndb-daily-sync",
  timeZone: "Europe/Moscow",
};

export const VNDB_THEME_MIN_LEVEL = 1.2;
export const VNDB_THEME_TAGS: Record<string, string> = {
  g12: "Action",
  g2: "Fantasy",
  g105: "Science fiction",
  g7: "Horror",
  g789: "Thriller",
  g3721: "Survival",
  g104: "Comedy",
  g147: "Drama",
  g1801: "Educational",
  g3650: "Sandbox",
  g456: "Warfare",
  g23: "Erotic",
  g19: "Mystery",
  g96: "Romance",
};

export const VNDB_WORLDWIDE_REGION = 8;
export const VNDB_LANGUAGE_REGIONS: Record<string, number> = {
  ja: 5,
  zh: 6,
  "zh-Hans": 6,
  "zh-Hant": 6,
  ko: 9,
  "pt-br": 10,
};

export const VNDB_KEYWORD_MIN_RATING = 2;
export const VNDB_EXPLICIT_SEXUAL_LEVEL = 1;
export const VNDB_EXPLICIT_IMAGES_KEYWORD = "18+ images";
export const VNDB_STATUS_NAMES: Record<number, string> = {
  0: "Released",
  2: "Cancelled",
};

export const VNDB_WEBSITE_LINK = "website";
export const VNDB_WIKI_LINKS = ["enwiki", "jawiki"];
export const VNDB_IGNORED_LINKS = ["egs", "patreonp", "steamdb"];
export const VNDB_STORE_NAMES: Record<string, string> = {
  steam: "Steam",
  gog: "GOG",
  playstation_jp: "PlayStation Store",
  playstation_na: "PlayStation Store",
  playstation_eu: "PlayStation Store",
  playstation_hk: "PlayStation Store",
};

export const VNDB_CHARACTER_GENDERS: Record<string, string> = {
  m: "Male",
  f: "Female",
  b: "Other",
  n: "Other",
};

export const INCOMPATIBLE_GENRES = [
  "Racing",
  "Sport",
  "Fighting",
  "Shooter",
  "Platform",
  "Pinball",
  "MOBA",
  "Music",
  "Quiz/Trivia",
  "Hack and slash/Beat 'em up",
  "Real Time Strategy (RTS)",
  "Card & Board Game",
  "Arcade",
];

export const VNDB_PLATFORM_SLUGS: Record<string, string[]> = {
  win: ["win"],
  lin: ["linux"],
  mac: ["mac"],
  web: ["browser"],
  tdo: ["3do"],
  ios: ["ios"],
  and: ["android"],
  bdp: ["blu-ray-player"],
  dos: ["dos"],
  dvd: ["dvd-player"],
  drc: ["dc"],
  nes: ["famicom", "nes", "fds"],
  sfc: ["sfam", "snes"],
  fm7: ["fm-7"],
  fm8: ["fm-7"],
  fmt: ["fm-towns"],
  gba: ["gba"],
  gbc: ["gbc"],
  msx: ["msx", "msx2"],
  nds: ["nds", "nintendo-dsi"],
  vnd: ["nds"],
  swi: ["switch"],
  sw2: ["switch-2"],
  wii: ["wii"],
  wiu: ["wiiu"],
  n3d: ["3ds", "new-3ds"],
  p88: ["pc-8800-series"],
  p98: ["pc-9800-series"],
  pce: ["turbografx16--1", "turbografx-16-slash-pc-engine-cd", "supergrafx"],
  pcf: ["pc-fx"],
  psp: ["psp"],
  ps1: ["ps"],
  ps2: ["ps2"],
  ps3: ["ps3"],
  ps4: ["ps4--1"],
  ps5: ["ps5"],
  psv: ["psvita"],
  smd: ["genesis-slash-megadrive"],
  scd: ["sega-cd"],
  sat: ["saturn"],
  x1s: ["x1"],
  x68: ["sharp-x68000"],
  xb1: ["xbox"],
  xb3: ["xbox360"],
  xbo: ["xboxone"],
  xxs: ["series-x-s"],
  mob: ["mobile"],
};

export const REEDITION_TYPES = [
  "Port",
  "Bundle",
  "Remaster",
  "Pack / Addon",
  "Update",
];
