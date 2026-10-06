import { IProfileBlock } from "@mooncellar/schemas";
import { CategoriesType } from "@/src/lib/shared/types/user.type";

export const userListCategories: CategoriesType[] = [
  "playing",
  "completed",
  "mastered",
  "played",
  "wishlist",
  "backlog",
  "dropped",
];

export const playthroughPriorityOrder: CategoriesType[] = [
  "wishlist",
  "backlog",
  "dropped",
  "playing",
  "played",
  "completed",
  "mastered",
];

export const FAVOURITE_GAMES_TAB = "favourites/games";
export const FAVOURITE_CHARACTERS_TAB = "favourites/characters";

export const legacyProfileTabs: Record<string, string> = {
  favorites: FAVOURITE_GAMES_TAB,
  characters: FAVOURITE_CHARACTERS_TAB,
  favourites: FAVOURITE_GAMES_TAB,
};

export const RETROACHIEVEMENTS_TAB = "retroachievements";
export const ACTIVITY_TAB = "activity";

export const PROFILE_BLOCK_LABELS: Record<IProfileBlock, string> = {
  counters: "Games, reviews and followers counters",
  favoriteGames: "Favourite games",
  favoriteCharacters: "Favourite characters",
  retroachievements: "RetroAchievements",
  lists: "Lists",
  likedLists: "Liked lists",
  activity: "Activity",
};

export const profileTabs = [
  "all",
  ...userListCategories,
  "lists",
  "liked",
  FAVOURITE_GAMES_TAB,
  FAVOURITE_CHARACTERS_TAB,
  "reviews",
  ACTIVITY_TAB,
  RETROACHIEVEMENTS_TAB,
  "settings",
];

export const profileTabLabels: Record<string, string> = {
  all: "All",
  playing: "Playing",
  completed: "Completed",
  mastered: "Mastered",
  played: "Played",
  wishlist: "Wishlist",
  backlog: "Backlog",
  dropped: "Dropped",
  lists: "Lists",
  liked: "Liked lists",
  [FAVOURITE_GAMES_TAB]: "Favourite games",
  [FAVOURITE_CHARACTERS_TAB]: "Favourite characters",
  reviews: "Reviews",
  [ACTIVITY_TAB]: "Activity",
  [RETROACHIEVEMENTS_TAB]: "RetroAchievements",
  settings: "Settings",
};

export const takeLogs = 24;
