export const GENERATED_LISTS_OWNER = {
  userName: "MoonCellar",
  email: "lists@mooncellar.space",
};

export const GENERATED_LIST_SIZE = 100;
export const GENERATED_LIST_VOTES_STEPS = [100, 50, 20, 10, 1];
export const GENERATED_LIST_GAME_TYPES = ["Main Game"];
export const GENERATED_LIST_STANDALONE_EXPANSION_TYPES = [
  "Standalone Expansion",
];
export const GENERATED_LIST_RECENT_YEARS = 5;
export const GENERATED_LIST_PRIOR_MEAN = 65;
export const GENERATED_LIST_PRIOR_VOTES = 100;
export const GENERATED_LIST_HLTB_WEIGHT = 10;

export const GENERATED_LIST_COMPANIES: {
  key: string;
  name: string;
  developers: RegExp[];
}[] = [
  {
    key: "rockstar-games",
    name: "Rockstar Games",
    developers: [/^Rockstar /, /^DMA Design$/],
  },
  { key: "valve", name: "Valve", developers: [/^Valve$/] },
  { key: "nintendo", name: "Nintendo", developers: [/^Nintendo/] },
  { key: "ubisoft", name: "Ubisoft", developers: [/^Ubisoft/] },
  { key: "naughty-dog", name: "Naughty Dog", developers: [/^Naughty Dog$/] },
  { key: "bioware", name: "BioWare", developers: [/^BioWare/] },
  {
    key: "bethesda-game-studios",
    name: "Bethesda Game Studios",
    developers: [/^Bethesda Game Studios/],
  },
  { key: "fromsoftware", name: "FromSoftware", developers: [/^FromSoftware$/] },
  {
    key: "blizzard-entertainment",
    name: "Blizzard Entertainment",
    developers: [/^Blizzard /],
  },
  {
    key: "cd-projekt-red",
    name: "CD Projekt RED",
    developers: [/^CD Projekt/],
  },
  { key: "square-enix", name: "Square Enix", developers: [/^Square/] },
  {
    key: "infinity-ward",
    name: "Infinity Ward",
    developers: [/^Infinity Ward$/],
  },
  { key: "capcom", name: "Capcom", developers: [/^Capcom/] },
  {
    key: "rocksteady-studios",
    name: "Rocksteady Studios",
    developers: [/^Rocksteady/],
  },
  { key: "konami", name: "Konami", developers: [/^Konami/] },
  { key: "id-software", name: "id Software", developers: [/^id Software$/] },
  { key: "telltale-games", name: "Telltale Games", developers: [/^Telltale/] },
  {
    key: "obsidian-entertainment",
    name: "Obsidian Entertainment",
    developers: [/^Obsidian Entertainment$/],
  },
  {
    key: "remedy-entertainment",
    name: "Remedy Entertainment",
    developers: [/^Remedy Entertainment$/],
  },
  { key: "bungie", name: "Bungie", developers: [/^Bungie/] },
  {
    key: "santa-monica-studio",
    name: "Santa Monica Studio",
    developers: [/Santa Monica Studio$/],
  },
  {
    key: "insomniac-games",
    name: "Insomniac Games",
    developers: [/^Insomniac Games$/],
  },
  { key: "arkane-studios", name: "Arkane Studios", developers: [/^Arkane /] },
  {
    key: "kojima-productions",
    name: "Kojima Productions",
    developers: [/^Kojima Productions$/],
  },
  {
    key: "platinumgames",
    name: "PlatinumGames",
    developers: [/^PlatinumGames$/],
  },
  {
    key: "supergiant-games",
    name: "Supergiant Games",
    developers: [/^Supergiant Games$/],
  },
];

export const GENERATED_LIST_KEYWORDS: {
  key: string;
  name: string;
  keywords: string[];
}[] = [
  { key: "soulslike", name: "soulslike", keywords: ["soulslike"] },
  { key: "metroidvania", name: "metroidvania", keywords: ["metroidvania"] },
  {
    key: "roguelike",
    name: "roguelike and roguelite",
    keywords: ["roguelike", "roguelite"],
  },
  { key: "immersive-sim", name: "immersive sim", keywords: ["immersive sim"] },
  { key: "jrpg", name: "JRPG", keywords: ["jrpg"] },
  { key: "cyberpunk", name: "cyberpunk", keywords: ["cyberpunk"] },
  {
    key: "post-apocalyptic",
    name: "post-apocalyptic",
    keywords: ["post-apocalyptic"],
  },
  { key: "steampunk", name: "steampunk", keywords: ["steampunk"] },
  { key: "dark-fantasy", name: "dark fantasy", keywords: ["dark fantasy"] },
  {
    key: "survival-horror",
    name: "survival horror",
    keywords: ["survival horror"],
  },
  {
    key: "psychological-horror",
    name: "psychological horror",
    keywords: ["psychological horror"],
  },
  {
    key: "lovecraftian",
    name: "Lovecraftian",
    keywords: ["lovecraftian", "cosmic horror"],
  },
  { key: "zombies", name: "zombie", keywords: ["zombies"] },
  { key: "time-travel", name: "time travel", keywords: ["time travel"] },
  { key: "detective", name: "detective", keywords: ["detective"] },
  { key: "pixel-art", name: "pixel art", keywords: ["pixel art"] },
  { key: "bullet-hell", name: "bullet hell", keywords: ["bullet hell"] },
];

export const GENERATED_LIST_DECADES: [number, number][] = [
  [1990, 2000],
  [2001, 2010],
  [2011, 2020],
  [2021, 2030],
];

export const GENERATED_LISTS_CRON = "0 5 * * 1";
export const GENERATED_LISTS_CRON_OPTIONS = {
  name: "generated-lists-refresh",
  timeZone: "Europe/Moscow",
};
