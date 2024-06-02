export interface IPayload {
  consoleId: number;
  shouldOnlyRetrieveGamesWithAchievements?: boolean;
  houldRetrieveGameHashes?: boolean;
}

export interface IConsole {
  id: number;
  name: string;
  iconUrl: string;
}

export interface IAuth {
  userName: string;
  webApiKey: string;
}

export interface IGame {
  title: string;
  id: number;
  consoleId: number;
  consoleName: string;
  imageIcon: string;
  numAchievements: number;
  numLeaderboards: number;
  points: number;
  dateModified: string;
  forumTopicId: number;
  hashes: string[];
}

export interface IHowlongToBeat {
  name: string;
  gameplayMain: number;
  gameplayMainExtra: number;
  gameplayCompletionist: number;
  imageUrl: string;
}
