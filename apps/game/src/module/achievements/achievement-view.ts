import type {
  IGameAchievement,
  IGamePlayerAchievement,
} from "@mooncellar/schemas";
import type { IGameAchievementDefinition } from "../../games/achievements";

export type IAchievementStateRow = {
  key: string;
  unlockedAt?: Date | null;
  current?: number | null;
};

// How far back a queued unlock may be dated: older times, and times ahead of the server, become now
export const UNLOCK_MAX_AGE_DAYS = 400;

export const iconPath = (game: string, icon: string) =>
  `/games/${game}/achievements/icons/${icon}`;

export const toAchievement = (
  game: string,
  achievement: IGameAchievementDefinition,
  unlocked: boolean
): IGameAchievement => {
  const secret = !!achievement.hidden && !unlocked;
  return {
    key: achievement.key,
    title: secret ? null : achievement.title,
    description: secret ? null : achievement.description,
    icon: iconPath(game, achievement.icon),
    hidden: !!achievement.hidden,
    progress: achievement.progress ?? null,
  };
};

export const toPlayerAchievement = (
  game: string,
  achievement: IGameAchievementDefinition,
  state: IAchievementStateRow | undefined
): IGamePlayerAchievement => {
  const unlocked = !!state?.unlockedAt;
  return {
    ...toAchievement(game, achievement, unlocked),
    unlocked,
    unlockedAt: state?.unlockedAt ? state.unlockedAt.toISOString() : null,
    current: state?.current ?? null,
  };
};

// When an unlock happened: the game's own time for an unlock sent later from its queue, when
// it is plausible; otherwise the moment the service heard of it
export const unlockTime = (given: string | undefined, now: Date): Date => {
  if (!given) return now;
  const at = new Date(given);
  const earliest = now.getTime() - UNLOCK_MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
  return at.getTime() >= earliest && at.getTime() <= now.getTime() ? at : now;
};
