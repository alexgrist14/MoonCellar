import { API_URL } from "../constants";
import { IPlatform } from "../lib/schemas/platforms.schema";
import agent from "./agent";

const PLATFORM_API = `${API_URL}/platforms`;

const getAll = () => {
  return agent.get<IPlatform[]>(`${PLATFORM_API}`);
};

export const platformsAPI = {
  getAll,
};
