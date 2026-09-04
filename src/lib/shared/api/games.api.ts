import { API_URL } from "../constants";
import { IGamesListResponse } from "../types/games.type";
import {
  IAddGameRequest,
  IGameResponse,
  IGenreResponse,
  IGetGameByIdRequest,
  IGetGameBySlugRequest,
  IGetGamesByIdsRequest,
  IGetGamesRequest,
  IGetGameSlugsResponse,
  IGetRandomGameSlugResponse,
  IUpcomingReleaseGroup,
  IUpdateGameRequest,
} from "../lib/schemas/games.schema";
import { IGetGameFollowingsStatusResponse } from "../lib/schemas/game-followings-status.schema";
import agent from "./agent.api";
import { filesAPI } from "./files.api";

const GAMES_URL = `${API_URL}/games`;

export const gamesApi = {
  getSlugs: () => {
    return agent.get<IGetGameSlugsResponse>(`${GAMES_URL}/slugs`);
  },

  getRandomSlug: () => {
    return agent.get<IGetRandomGameSlugResponse>(`${GAMES_URL}/random-slug`);
  },

  getById: (params: IGetGameByIdRequest) => {
    return agent.get<IGameResponse>(`${GAMES_URL}/by-id/${params._id}`);
  },

  getFollowingsStatus: (gameId: string, userId: string) => {
    return agent.get<IGetGameFollowingsStatusResponse>(
      `${GAMES_URL}/${gameId}/followings-status`,
      { params: { userId } }
    );
  },

  getByIds: (params: IGetGamesByIdsRequest) => {
    if (!params.search) {
      const ids = Array.isArray(params._ids) ? params._ids : [params._ids];

      return agent.get<IGameResponse[]>(
        `${GAMES_URL}/by-ids?_ids=${ids.join("&_ids=")}`
      );
    }

    return agent.post<IGameResponse[]>(`${GAMES_URL}/by-ids`, params);
  },

  getBySlug: (params: IGetGameBySlugRequest) => {
    return agent.get<IGameResponse>(`${GAMES_URL}/by-slug/${params.slug}`, {
      params,
    });
  },

  getAll: async (data: IGetGamesRequest) => {
    return agent.post<IGamesListResponse>(`${GAMES_URL}`, data);
  },

  add: (dto: IAddGameRequest) => {
    return agent.post<IGameResponse>(`${GAMES_URL}/add`, dto);
  },

  update: (id: string, dto: IUpdateGameRequest) => {
    return agent.put<IGameResponse>(`${GAMES_URL}/update/${id}`, dto);
  },

  uploadImage: (
    gameId: string,
    type: "cover" | "screenshot" | "artwork",
    file: File
  ) => {
    const formData = new FormData();

    formData.append("file", file);

    return agent.post<string>(`${GAMES_URL}/upload-image/${gameId}`, formData, {
      params: { gameId, type },
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  remove: async (id: string) => {
    return agent.delete<IGameResponse>(`${GAMES_URL}/delete/${id}`);
  },

  getTopRatedRandom: async () => {
    return agent.get<IGameResponse[]>(`${GAMES_URL}/top-rated-random`);
  },

  getTotalGamesByCount: async () => {
    return agent.get<IGenreResponse[]>(`${GAMES_URL}/count-by-genre`);
  },

  getUpcomingReleases: async () => {
    return agent.get<IUpcomingReleaseGroup[]>(`${GAMES_URL}/upcoming`);
  },

  getRecentReleases: async () => {
    return agent.get<IGameResponse[]>(`${GAMES_URL}/recent`);
  },

  getFilters: async (): Promise<
    | {
        modes: string[];
        themes: string[];
        keywords: string[];
        genres: string[];
        companies: string[];
        type: string[];
        franchises?: string[];
        game_engines: string[];
        player_perspectives: string[];
        languages: string[];
        status: string[];
        ageRatings: string[];
      }
    | undefined
  > => {
    const res = await filesAPI.getFile({
      key: "filters",
      bucketName: "mooncellar-common",
    });
    return JSON.parse(res.data.content as string);
  },
};
