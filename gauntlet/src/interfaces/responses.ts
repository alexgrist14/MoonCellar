export interface IPayload {
  consoleId: number;
  shouldOnlyRetrieveGamesWithAchievements?: boolean;
  houldRetrieveGameHashes?: boolean;
}

export interface IGame {
  consoleId: number;
  consoleName: string;
  dateModified: string;
  forumTopicId: number;
  id: number;
  imageIcon: string;
  numAchievements: number;
  numLeaderboards: number;
  points: number;
  title: string;
}

export interface IConsole {
  id: number;
  name: string;
}


export interface IAuth{
  userName: string;
  webApiKey: string;
}