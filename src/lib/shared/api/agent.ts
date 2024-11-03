import axios from "axios";
import { getCookie } from "../utils/cookies";
import { ACCESS_TOKEN } from "../constants";

export const agent = axios.create({
  withCredentials: true,
});

agent.interceptors.request.use(
  (config) => {
    const token = getCookie(ACCESS_TOKEN);

    config.headers["Content-Type"] =
      config.headers["Content-Type"] || `application/json`;
    config.headers.Authorization = `Bearer ${token}`;

    return config;
  },
  (error) => Promise.reject(error),
);

agent.interceptors.response.use(
  (response) => response,
  (error) => {
    return Promise.reject(error);
  },
);

export default agent;
