import {
  IAddGauntletHistoryRequest,
  IGetGauntletHistoryRequest,
} from "@mooncellar/schemas";
import { API_URL } from "@/src/lib/shared/constants";
import { IGamesListResponse } from "@/src/lib/shared/types/games.type";
import agent from "./agent.api";

const GAUNTLET_HISTORY_URL = `${API_URL}/gauntlet-history`;

export const gauntletHistoryApi = {
  get: (params: IGetGauntletHistoryRequest) =>
    agent.get<IGamesListResponse>(GAUNTLET_HISTORY_URL, { params }),
  getIds: () => agent.get<string[]>(`${GAUNTLET_HISTORY_URL}/ids`),
  add: (data: IAddGauntletHistoryRequest) =>
    agent.post<void>(GAUNTLET_HISTORY_URL, data),
  remove: (gameId: string) =>
    agent.delete<void>(`${GAUNTLET_HISTORY_URL}/${gameId}`),
  clear: () => agent.delete<void>(GAUNTLET_HISTORY_URL),
};
