export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://api.mooncellar.space";

export const FRONT_URL =
  process.env.NEXT_PUBLIC_FRONT_URL || "https://mooncellar.space";

export const ACCESS_TOKEN = "accessMoonToken";
export const REFRESH_TOKEN = "refreshMoonToken";

export const accentColor = "#6951ee";
export const accentColorRGB = "105,81,238";

export const links = [
  { name: "Home", link: "/" },
  { name: "Games", link: "/games" },
  { name: "Gauntlet", link: "/gauntlet" },
];

export const getImageLink = (
  url: string,
  size:
    | "thumb"
    | "micro"
    | "cover_big"
    | "cover_small"
    | "screenshot_big"
    | "screenshot_med"
    | "screenshot_huge"
    | "logo_med"
    | "720p"
    | "1080p",
  multiply?: number
) => {
  return (
    (url.includes("http") ? "" : "https:") +
    url.replace("thumb", !!multiply ? `${size}_${multiply}x` : size)
  );
};

export const dateRegions = [
  "Europe",
  "North America",
  "Australia",
  "New Zealand",
  "Japan",
  "China",
  "Asia",
  "Worldwide",
  "Korea",
  "Brazil",
];

export const gameCategories: { [key: string]: number } = {
  main_game: 0,
  dlc_addon: 1,
  expansion: 2,
  bundle: 3,
  standalone_expansion: 4,
  mod: 5,
  episode: 6,
  season: 7,
  remake: 8,
  remaster: 9,
  expanded_game: 10,
  port: 11,
  fork: 12,
  pack: 13,
  update: 14,
};

export const gameCategoryNames: { [key: string]: string } = {
  main_game: "Game",
  dlc_addon: "DLC",
  expansion: "Expansion",
  bundle: "Bundle",
  standalone_expansion: "Standalone expansion",
  mod: "Mod",
  episode: "Episode",
  season: "Season",
  remake: "Remake",
  remaster: "Remaster",
  expanded_game: "Expanded game",
  port: "Port",
  fork: "Fork",
  pack: "Pack",
  update: "Update",
};

export const coverRatio = 528 / 704;
