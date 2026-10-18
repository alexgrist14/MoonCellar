import type {
  IGameAchievement,
  IGamePlayerAchievement,
} from "@mooncellar/schemas";
import { IPortAchievement } from "./port-achievement.type";

const UNIT_SUFFIX: Record<string, string> = { count: "", m: " m", s: " s" };

const isPlayerAchievement = (
  achievement: IPortAchievement
): achievement is IGamePlayerAchievement => "unlocked" in achievement;

// The site is in English; a hidden achievement has no texts until it is unlocked
export const getPortAchievementTitle = (achievement: IPortAchievement) =>
  achievement.title?.en ?? "Hidden achievement";

export const getPortAchievementDescription = (achievement: IPortAchievement) =>
  achievement.description?.en ?? "Revealed once unlocked.";

export const isPortAchievementUnlocked = (achievement: IPortAchievement) =>
  isPlayerAchievement(achievement) && achievement.unlocked;

export const getPortAchievementUnlockedAt = (achievement: IPortAchievement) =>
  isPlayerAchievement(achievement) ? achievement.unlockedAt : null;

// How far a counter is, as "572 / 1,000 m"; null when it has no goal or no progress yet
export const getPortAchievementProgress = (achievement: IPortAchievement) => {
  const { progress } = achievement;

  if (!progress || !isPlayerAchievement(achievement)) return null;
  if (achievement.unlocked || achievement.current === null) return null;

  const current = Math.min(achievement.current, progress.target);

  return {
    current,
    target: progress.target,
    label: `${current.toLocaleString("en")} / ${progress.target.toLocaleString("en")}${UNIT_SUFFIX[progress.unit]}`,
  };
};

// The catalogue with the player's states over it, in the catalogue's order
export const mergePortAchievements = (
  catalogue: IGameAchievement[],
  player?: IGamePlayerAchievement[]
): IPortAchievement[] => {
  if (!player) return catalogue;

  const byKey = new Map(
    player.map((achievement) => [achievement.key, achievement])
  );

  return catalogue.map(
    (achievement) => byKey.get(achievement.key) ?? achievement
  );
};
