export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://api.mooncellar.space";

export const apiNames: { [key: string]: string } = {
  RA: "RetroAchievements",
  IGDB: "IGDB",
};

export const links = [
  { tabName: "Home", tabLink: "/" },
  { tabName: "Gauntlet", tabLink: "/gauntlet" },
  { tabName: "Games", tabLink: "/games" },
  { tabName: "Profile", tabLink: "/user" },
];

export const imageTypes = [
  "thumb",
  "cover_small",
  "screenshot_med",
  "cover_big",
  "logo_med",
  "screenshot_big",
  "screenshot_huge",
  "micro",
  "720p",
  "1080p",
];
