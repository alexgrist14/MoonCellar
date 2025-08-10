import { API_URL } from "../constants";
import {
  IGetPlaythroughsMinimalResponse,
  IGetPlaythroughsRequest,
  IGetPlaythroughsResponse,
  IPlaythrough,
  ISavePlaythroughRequest,
  IUpdatePlaythroughRequest,
} from "../lib/schemas/playthroughs.schema";
import agent from "./agent.api";

const PLAYTHROUGHS_API = `${API_URL}/playthroughs`;

const getAll = (params: IGetPlaythroughsRequest) => {
  return agent.get<IGetPlaythroughsResponse>(`${PLAYTHROUGHS_API}`, {
    params,
  });
};

const getAllMinimal = (params: IGetPlaythroughsRequest) => {
  return agent.get<IGetPlaythroughsMinimalResponse>(
    `${PLAYTHROUGHS_API}/minimal`,
    {
      params,
    }
  );
};

const create = (data: ISavePlaythroughRequest) => {
  return agent.post<IPlaythrough>(`${PLAYTHROUGHS_API}/save`, data);
};

const update = (
  userId: string,
  id: string,
  data: IUpdatePlaythroughRequest
) => {
  return agent.put<IPlaythrough>(
    `${PLAYTHROUGHS_API}/update/${userId}/${id}`,
    data
  );
};

const remove = (userId: string, id: string) => {
  return agent.delete<IPlaythrough>(
    `${PLAYTHROUGHS_API}/delete/${userId}/${id}`
  );
};

export const playthroughsAPI = {
  getAll,
  getAllMinimal,
  create,
  update,
  remove,
};
