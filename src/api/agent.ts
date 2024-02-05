import axios from "axios";
import { store } from "../store";

export const auth = () =>
  axios.post(
    `https://id.twitch.tv/oauth2/token?client_id=${process.env.REACT_APP_TWITCH_CLIENT_ID}&client_secret=${process.env.REACT_APP_TWITCH_APP_ACCESS_TOKEN}&grant_type=client_credentials`
  );

export const IGDBAgent = <T>(url: string, params?: any) => {
  return axios.request<T>({
    url: process.env.REACT_APP_CORS_SERVER || "",
    method: "post",
    withCredentials: false,
    params,
    headers: {
      Accept: "application/json",
      "Client-ID": process.env.REACT_APP_TWITCH_CLIENT_ID,
      Authorization: `Bearer ${store.getState().auth.token}`,
      "Target-URL": url,
    },
  });
};
