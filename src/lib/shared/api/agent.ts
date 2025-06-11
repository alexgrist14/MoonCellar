import axios, { AxiosError } from "axios";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constants";
import { authAPI } from "./auth";
import { deleteCookie } from "../utils/cookies";
import { toast } from "../utils/toast";

export const agent = axios.create({
  withCredentials: true,
});

agent.interceptors.response.use(
  (response) => response,
  (err: AxiosError) => {
    const { config } = err;

    if (
      err.response &&
      err.response.status === 401 &&
      !err.config?.url?.includes("/refresh")
    ) {
      return (
        !!config &&
        authAPI
          .refreshToken()
          .then(() => agent(config))
          .catch(() => {
            deleteCookie(ACCESS_TOKEN);
            deleteCookie(REFRESH_TOKEN);

            toast.error({ title: "Error", description: "Not authorized" });
          })
      );
    } else {
      return Promise.reject(err);
    }
  }
);

export default agent;
