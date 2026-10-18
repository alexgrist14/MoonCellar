import axios from "axios";
import type {
  IGameAchievementList,
  IGameDefinitionInfo,
  IGamePlayerAchievements,
  IGamePlayerGameAchievements,
} from "@mooncellar/schemas";
import { GAME_PUBLIC_URL, GAME_URL } from "@/src/lib/shared/constants";

// Its own client, not `agent`: the game service allows no credentials in CORS, and a game without
// achievements answers 404, which `agent` would toast on every page that only asks
const gameAgent = axios.create({ baseURL: GAME_URL, timeout: 10_000 });

export const portAchievementsApi = {
  getGames: () => gameAgent.get<IGameDefinitionInfo[]>("/games"),
  getAchievements: (game: string) =>
    gameAgent.get<IGameAchievementList>(`/games/${game}/achievements`),
  getPlayerAchievements: (game: string, userId: string) =>
    gameAgent.get<IGamePlayerAchievements>(
      `/games/${game}/achievements/players/${userId}`
    ),
  getPlayerGames: (userId: string) =>
    gameAgent.get<IGamePlayerGameAchievements[]>(
      `/achievements/players/${userId}`
    ),
  // `icon` is the service's path, `/games/<game>/achievements/icons/<file>.svg`
  getIconUrl: (icon: string) => `${GAME_PUBLIC_URL}${icon}`,
};
