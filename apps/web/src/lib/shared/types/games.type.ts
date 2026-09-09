import { IGameResponse } from "../lib/schemas/games.schema";

export interface IGamesListResponse {
  results: IGameResponse[];
  total: number;
}

export interface IPlatformCount {
  name: string;
  slug: string;
  count: number;
}
