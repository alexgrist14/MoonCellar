import axios from "axios";

export const agent = axios.create({
  withCredentials: true,
});

agent.interceptors.request.use(
  (config) => {
    config.headers["Content-Type"] =
      config.headers["Content-Type"] || `application/json`;

    return config;
  },
  (error) => Promise.reject(error)
);

agent.interceptors.response.use(
  (response) => response,
  (error) => {
    return Promise.reject(error);
  }
);

export default agent;
