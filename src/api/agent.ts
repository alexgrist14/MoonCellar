import axios from "axios";

const auth = () =>
  axios.post(
    `https://id.twitch.tv/oauth2/token?client_id=${process.env.REACT_APP_TWITCH_CLIENT_ID}&client_secret=${process.env.REACT_APP_TWITCH_APP_ACCESS_TOKEN}&grant_type=client_credentials`
  );

export const IGDBAgent = async (url: string, params?: any, data?: string) => {
  const response = await auth();

  return axios.post(process.env.REACT_APP_CORS_SERVER || "", "limit 100;", {
    withCredentials: false,
    data: "where id = 1942;",
    headers: {
      Accept: "application/json",
      "Client-ID": process.env.REACT_APP_TWITCH_CLIENT_ID,
      Authorization: `Bearer ${response.data.access_token}`,
      "Target-URL": url,
    },
  });
};
