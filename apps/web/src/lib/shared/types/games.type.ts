import { IGameResponse } from "@mooncellar/schemas";

export interface IGamesListResponse {
  results: IGameResponse[];
  total: number;
}

export interface IPlatformCount {
  name: string;
  slug: string;
  count: number;
}
