export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://api.mooncellar.space";

export const apiNames: { [key: string]: string } = {
  RA: "RetroAchievements",
  IGDB: "IGDB",
};

export const links = [
  { name: "Home", link: "/" },
  { name: "Gauntlet", link: "/gauntlet" },
  { name: "Games", link: "/games" },
  { name: "Profile", link: "/user" },
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
    "https:" + url.replace("thumb", !!multiply ? `${size}_${multiply}x` : size)
  );
};

export const gameCategories = [
  "main_game",
  "dlc_addon",
  "expansion",
  "bundle",
  "standalone_expansion",
  "mod",
  "episode",
  "season",
  "remake",
  "remaster",
  "expanded_game",
  "port",
  "fork",
  "pack",
  "update",
];
