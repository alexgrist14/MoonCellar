import { CategoriesType } from "../types/user.type";

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

export const takeLogs = 10;
