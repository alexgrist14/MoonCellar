export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://api.mooncellar.space";

export const ACCESS_TOKEN = "accessMoonToken";
export const REFRESH_TOKEN = "refreshMoonToken";

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
  multiply?: number,
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

export const mockGame = {
  _id: 280662,
  __v: 0,
  artworks: [],
  category: 0,
  cover: {
    _id: 351392,
    __v: 0,
    game: "280662",
    height: 900,
    url: "//images.igdb.com/igdb/image/upload/t_thumb/co7j4w.jpg",
    width: 600,
  },
  first_release_date: 1705622400,
  game_modes: [1],
  genres: [12, 13, 32],
  involved_companies: [],
  keywords: [343, 1961, 3586],
  name: "Furry Holes",
  platforms: [
    {
      _id: 6,
      __v: 0,
      created_at: 1297639288,
      name: "PC (Microsoft Windows)",
      platform_logo: 670,
      slug: "win",
    },
  ],
  screenshots: [],
  slug: "furry-holes",
  summary:
    "Furry Holes - is a classic 2D game in the memory genre which is about you find the same pictures and enjoy different images of furry beautiful ladies.",
  themes: [1, 42],
  websites: [603514],
  url: "https://www.igdb.com/games/furry-holes",
  release_dates: [
    {
      _id: 556343,
      __v: 0,
      category: 0,
      date: 1705622400,
      human: "Jan 19, 2024",
      m: 1,
      platform: 6,
      region: 8,
      y: 2024,
    },
  ],
} as any;
