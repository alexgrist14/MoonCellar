export const categories = {
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

export const categoryTypeNames: Record<number, string> = {
  0: "Main Game",
  1: "DLC",
  2: "Expansion",
  3: "Bundle",
  4: "Standalone Expansion",
  5: "Mod",
  6: "Episode",
  7: "Season",
  8: "Remake",
  9: "Remaster",
  10: "Expanded Game",
  11: "Port",
  12: "Fork",
  13: "Pack / Addon",
  14: "Update",
};

export const gameStatusNames: Record<number, string> = {
  0: "Released",
  2: "Alpha",
  3: "Beta",
  4: "Early Access",
  5: "Offline",
  6: "Cancelled",
  7: "Rumored",
  8: "Delisted",
};

export const externalGameSourceNames: Record<number, string> = {
  1: "Steam",
  3: "GiantBomb",
  5: "GOG",
  10: "YouTube",
  14: "Twitch",
  20: "Amazon",
  26: "Epic Games",
  36: "PlayStation Store",
};
