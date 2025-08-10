import { API_URL } from "../constants";
import {
  IGameResponse,
  IGetGameByIdRequest,
  IGetGameBySlugRequest,
  IGetGamesByIdsRequest,
  IGetGamesRequest,
  IUpdateGameRequest,
} from "../lib/schemas/games.schema";
import agent from "./agent.api";
import { filesAPI } from "./files.api";

const GAMES_URL = `${API_URL}/games`;

export const gamesApi = {
  getById: (params: IGetGameByIdRequest) => {
    return agent.get<IGameResponse>(`${GAMES_URL}/by-id/${params._id}`);
  },

  getByIds: (params: IGetGamesByIdsRequest) => {
    return agent.get<IGameResponse[]>(
      `${GAMES_URL}/by-ids?_ids=${params._ids.join("&_ids=")}`
    );
  },

  getBySlug: (params: IGetGameBySlugRequest) => {
    return agent.get<IGameResponse>(`${GAMES_URL}/by-slug/${params.slug}`, {
      params,
    });
  },

  getAll: async (data: IGetGamesRequest) => {
    return agent.post<{ results: IGameResponse[]; total: number }>(
      `${GAMES_URL}`,
      data
    );
  },

  add: () => {
    return agent.post<IGameResponse>(`${GAMES_URL}/add`, {});
  },

  update: (id: string, dto: IUpdateGameRequest) => {
    return agent.put<IGameResponse>(`${GAMES_URL}/update/${id}`, dto);
  },

  remove: async (id: string) => {
    return agent.delete<IGameResponse>(`${GAMES_URL}/delete/${id}`);
  },

  getFilters: async (): Promise<
    | {
        modes: string[];
        themes: string[];
        keywords: string[];
        genres: string[];
        companies: string[];
        type: string[];
      }
    | undefined
  > => {
    const res = await filesAPI.getFile("filters", "mooncellar-common");
    return res.data;
  },
};
