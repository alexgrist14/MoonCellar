import axios, { AxiosError } from "axios";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constants";
import { authAPI } from "./auth.api";
import { deleteCookie } from "../utils/cookies.utils";
import { toast } from "../utils/toast.utils";

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
          .catch(() => {
            deleteCookie(ACCESS_TOKEN);
            deleteCookie(REFRESH_TOKEN);

            toast.error({ title: "Error", description: "Not authorized" });
          })
      );
    } else {
      const errorMessage = err?.response?.data?.message ?? "unknown";

      toast.error({ title: "Error", description: errorMessage });
      return Promise.reject(err);
    }
  }
);

export default agent;
