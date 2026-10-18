import type {
  IGameAchievement,
  IGameAchievementList,
  IGameDefinitionInfo,
  IGamePlayerAchievement,
} from "@mooncellar/schemas";

// A port's catalogue with the port itself (its name and the site page it belongs to)
export type IPortGameAchievements = IGameAchievementList & {
  port: IGameDefinitionInfo;
};

// One achievement as a page shows it: the catalogue's, or the player's with their state
export type IPortAchievement = IGameAchievement | IGamePlayerAchievement;
