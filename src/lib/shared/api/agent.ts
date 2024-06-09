import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import { store } from "../../app/store";

export const IGDBAgent = <T>(url: string, params?: any) => {
  return axios.request<T>({
    url: process.env.NEXT_PUBLIC_CORS_SERVER || "",
    method: "post",
    withCredentials: false,
    params,
    headers: {
      Accept: "application/json",
      "Client-ID": process.env.NEXT_PUBLIC_TWITCH_CLIENT_ID,
      Authorization: `Bearer ${store.getState().auth.token}`,
      "Target-URL": url,
    },
  });
};

export const agent = <T>(
  url: string,
  method: "get" | "post" | "put" | "delete",
  options?: AxiosRequestConfig
): Promise<AxiosResponse<T>> =>
  axios.request({
    url,
    method,
    ...options,
  });
