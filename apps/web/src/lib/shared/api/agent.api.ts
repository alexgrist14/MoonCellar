import axios, { AxiosError } from "axios";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "@/src/lib/shared/constants";
import { authAPI } from "./auth.api";
import { deleteCookie } from "@/src/lib/shared/utils/cookies.utils";
import { toast } from "@/src/lib/shared/utils/toast.utils";
import { useAuthStore } from "@/src/lib/shared/store/auth.store";
import { logger } from "@/src/lib/shared/utils/logger.utils";

declare module "axios" {
  interface AxiosRequestConfig {
    isSilent?: boolean;
  }
}

export const agent = axios.create({
  withCredentials: true,
});

agent.interceptors.response.use(
  (response) => response,
  (err: AxiosError<{ message: string }>) => {
    const { config } = err;
    const isRefreshRequest = !!err.config?.url?.includes("/refresh");
    const isCredentialsRequest = /\/auth\/(login|signup)$/.test(
      err.config?.url ?? ""
    );

    if (
      err.response?.status === 401 &&
      (isRefreshRequest || isCredentialsRequest)
    ) {
      return Promise.reject(err);
    }

    if (err.response?.status === 401 && config) {
      return authAPI
        .refreshToken()
        .then(() => agent(config))
        .catch((refreshError) => {
          deleteCookie(ACCESS_TOKEN);
          deleteCookie(REFRESH_TOKEN);
          useAuthStore.getState().clear();

          logger.error("Token refresh failed", refreshError, {
            originalUrl: config?.url,
            originalMethod: config?.method,
          });

          toast.error({ title: "Error", description: "Not authorized" });
          return Promise.reject(refreshError);
        });
    }

    const message = err.response?.data?.message;
    const errorMessage =
      typeof message === "string" && message
        ? message
        : err.response
          ? `Request failed with status ${err.response.status}`
          : "The server could not be reached. Check your connection.";

    logger.error("API request error", err, {
      url: err.config?.url,
      method: err.config?.method,
      status: err.response?.status,
      statusText: err.response?.statusText,
      responseData: err.response?.data,
      errorMessage,
    });

    if (!config?.isSilent) {
      toast.error({ title: "Error", description: errorMessage });
    }

    return Promise.reject(err);
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
