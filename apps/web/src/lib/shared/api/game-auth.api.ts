import type { IGameDeviceLink, IGameSession } from "@mooncellar/schemas";
import { API_URL } from "@/src/lib/shared/constants";
import agent from "./agent.api";

const GAME_AUTH_URL = `${API_URL}/auth/game`;

export const gameAuthApi = {
  getLink: (userCode: string) =>
    agent.get<IGameDeviceLink>(
      `${GAME_AUTH_URL}/device/${encodeURIComponent(userCode)}`
    ),
  approve: (userCode: string) =>
    agent.post<IGameDeviceLink>(`${GAME_AUTH_URL}/device/approve`, {
      userCode,
    }),
  getSessions: () => agent.get<IGameSession[]>(`${GAME_AUTH_URL}/sessions`),
  revokeSession: (id: string) =>
    agent.delete(`${GAME_AUTH_URL}/sessions/${id}`),
};
