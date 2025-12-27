import axios, { AxiosError } from "axios";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constants";
import { authAPI } from "./auth.api";
import { deleteCookie } from "../utils/cookies.utils";
import { toast } from "../utils/toast.utils";
import { useAuthStore } from "../store/auth.store";
import { logger } from "../utils/logger.utils";

export const agent = axios.create({
  withCredentials: true,
});

agent.interceptors.response.use(
  (response) => response,
  (err: AxiosError<{ message: string }>) => {
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
          .catch((refreshError) => {
            deleteCookie(ACCESS_TOKEN);
            deleteCookie(REFRESH_TOKEN);

            // Логируем ошибку обновления токена
            logger.error("Token refresh failed", refreshError, {
              originalUrl: config?.url,
              originalMethod: config?.method,
            });

            toast.error({ title: "Error", description: "Not authorized" });
          })
      );
    } else {
      const errorMessage = err?.response?.data?.message ?? "unknown";

      // Логируем ошибку API в Grafana
      logger.error("API request error", err, {
        url: err.config?.url,
        method: err.config?.method,
        status: err.response?.status,
        statusText: err.response?.statusText,
        responseData: err.response?.data,
        errorMessage,
      });

      toast.error({ title: "Error", description: errorMessage });
      return Promise.reject(err);
    }
  }
);

agent.interceptors.request.use((config) => {
  const state = useAuthStore.getState();
  if (state.profile?._id) {
    config.headers["x-user-id"] = state.profile._id;
  }
  return config;
});

export default agent;
