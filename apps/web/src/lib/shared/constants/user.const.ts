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

export const profileTabs = [
  "all",
  ...userListCategories,
  "lists",
  "liked",
  "characters",
  "reviews",
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
  characters: "Favourite characters",
  reviews: "Reviews",
  settings: "Settings",
};

export const takeLogs = 20;
