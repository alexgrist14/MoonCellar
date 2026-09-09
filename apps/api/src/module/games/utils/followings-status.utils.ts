export type FollowingsStatusDisplayCategory =
  | "mastered"
  | "completed"
  | "playing"
  | "played"
  | "backlog"
  | "wishlist"
  | "dropped";

export type FollowingsStatusPlaythroughInput = {
  category: string;
  isMastered?: boolean;
};

const PRIORITY: FollowingsStatusDisplayCategory[] = [
  "mastered",
  "completed",
  "playing",
  "played",
  "backlog",
  "wishlist",
  "dropped",
];

export const pickFollowingsStatus = (
  plays: FollowingsStatusPlaythroughInput[]
): { category: FollowingsStatusDisplayCategory; count: number } | null => {
  if (!plays.length) return null;

  for (const category of PRIORITY) {
    const matching =
      category === "mastered"
        ? plays.filter((play) => play.isMastered === true)
        : plays.filter(
            (play) => play.category === category && play.isMastered !== true
          );

    if (matching.length) {
      return { category, count: matching.length };
    }
  }

  return null;
};
