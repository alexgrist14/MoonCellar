import axios, { AxiosRequestConfig, AxiosResponse } from "axios";

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
