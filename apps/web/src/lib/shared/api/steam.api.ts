import {
  IGetSteamLibraryRequest,
  IGetSteamLibraryResponse,
  ISteamAchievementsField,
  ILinkSteamAccountRequest,
  ISteamLoginUrlResponse,
  ISteamSyncResponse,
  IUnlinkSteamAccountResponse,
} from "@mooncellar/schemas";
import { API_URL } from "@/src/lib/shared/constants";
import agent from "./agent.api";

const STEAM_ACCOUNT_URL = `${API_URL}/steam/account`;

export const steamAPI = {
  getLoginUrl: () =>
    agent.get<ISteamLoginUrlResponse>(`${STEAM_ACCOUNT_URL}/login-url`),
  link: (dto: ILinkSteamAccountRequest) =>
    agent.post<ISteamSyncResponse>(`${STEAM_ACCOUNT_URL}/link`, dto),
  sync: () => agent.post<ISteamSyncResponse>(`${STEAM_ACCOUNT_URL}/sync`),
  unlink: () => agent.delete<IUnlinkSteamAccountResponse>(STEAM_ACCOUNT_URL),
  syncPlaythroughs: () =>
    agent.post<{ created: number }>(`${STEAM_ACCOUNT_URL}/playthroughs/sync`),
  getLibrary: (dto: IGetSteamLibraryRequest) =>
    agent.post<IGetSteamLibraryResponse>(`${API_URL}/steam/library`, dto),
  parseAchievements: (gameId: string) =>
    agent.post<ISteamAchievementsField>(
      `${API_URL}/steam/achievements/games/${gameId}`
    ),
};
