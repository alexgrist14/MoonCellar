import { jwtDecode } from "jwt-decode";
import { RequestCookie } from "next/dist/compiled/@edge-runtime/cookies";
import { Dispatch, SetStateAction, useEffect } from "react";
import { useAuthStore } from "../store/auth.store";
import { IAuthToken } from "../types/auth.type";
import { authAPI, userAPI } from "../api";
import { deleteCookie } from "../utils/cookies.utils";
import { REFRESH_TOKEN } from "../constants";

interface ITokens {
  accessToken?: RequestCookie;
  refreshToken?: RequestCookie;
}

export const useAuthRefresh = (
  tokens: ITokens,
  setIsAccessReady?: Dispatch<SetStateAction<boolean>>
) => {
  const { setAuth, clear, setProfile } = useAuthStore();
  const { accessToken, refreshToken } = tokens;

  return useEffect(() => {
    const access: IAuthToken | undefined = !!accessToken
      ? jwtDecode(accessToken.value)
      : undefined;
    const refresh: IAuthToken | undefined = !!refreshToken
      ? jwtDecode(refreshToken.value)
      : undefined;
    const isValid =
      !!access &&
      !isNaN(access.exp) &&
      new Date().getTime() < access.exp * 1000;

    if (!!refresh && !isValid) {
      setAuth(false);

      authAPI
        .refreshToken()
        .then((res) => {
          setAuth(true);

          userAPI.getById(res.data.userId).then((res) => {
            setProfile(res.data);
          });
        })
        .catch(() => {
          clear();
          deleteCookie(REFRESH_TOKEN);
        })
        .finally(() => {
          setIsAccessReady?.(true);
        });
    } else {
      setAuth(isValid);
      setIsAccessReady?.(true);

      !!access?.id &&
        userAPI.getById(access?.id).then((res) => {
          setProfile(res.data);
        });
    }
  }, [accessToken, refreshToken, clear, setAuth, setIsAccessReady, setProfile]);
};
