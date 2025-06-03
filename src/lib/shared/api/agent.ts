import axios from "axios";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constants";
import { authAPI } from "./auth";
import { deleteCookie } from "../utils/cookies";
import { toast } from "../utils/toast";

export const agent = axios.create({
  withCredentials: true,
});

agent.interceptors.response.use(
  (response) => response,
  (err) => {
    const requestConfig = err.config;

    if (
      err.response &&
      err.response.status === 401 &&
      !err.config.url.includes("/refresh")
    ) {
      authAPI
        .refreshToken()
        .then(() => agent(requestConfig))
        .catch(() => {
          deleteCookie(ACCESS_TOKEN);
          deleteCookie(REFRESH_TOKEN);

          toast.error({ title: "Error", description: "Not authorized" });
        });
    } else if (err.config.url.includes("/refresh")) {
      return Promise.reject(err);
    } else {
      const errorMessage = err?.response?.data?.message ?? "unknown";
      if (err.config.url.includes("/verify") && errorMessage.includes("500")) {
        toast.error({ title: "Error", description: "Conditions changed" });
      } else {
        toast.error({ title: "Error", description: errorMessage });
      }

      return Promise.reject(err);
    }
  }
);

export default agent;
