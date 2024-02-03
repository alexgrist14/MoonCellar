import axios from "axios";

const auth = () =>
  axios.post(
    `https://id.twitch.tv/oauth2/token?client_id=${process.env.REACT_APP_TWITCH_CLIENT_ID}&client_secret=${process.env.REACT_APP_TWITCH_APP_ACCESS_TOKEN}&grant_type=client_credentials`
  );

export const IGDBAgent = async (url: string, params?: any) => {
  const response = await auth();

  return axios.request({
    url: process.env.REACT_APP_CORS_SERVER || "",
    method: 'post',
    withCredentials: false,
    params,
    headers: {
      Accept: "application/json",
      "Client-ID": process.env.REACT_APP_TWITCH_CLIENT_ID,
      Authorization: `Bearer ${response.data.access_token}`,
      "Target-URL": url,
    },
  });
};
