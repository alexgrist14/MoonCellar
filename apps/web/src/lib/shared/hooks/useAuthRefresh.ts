import { useAuthStore } from "../store/auth.store";
import { authAPI, userAPI } from "../api";
import { deleteCookie } from "../utils/cookies.utils";
import { REFRESH_TOKEN } from "../constants";
import { useEffect } from "react";

export const useAuthRefresh = () => {
  const { setAuth, clear, setProfile, setIsAdmin } = useAuthStore();

  return useEffect(() => {
    authAPI
      .refreshToken()
      .then((res) => {
        setAuth(true);

        userAPI.getById(res.data.userId).then((res) => {
          const isAdmin = !!res.data.roles?.includes("admin");

          setProfile(res.data);
          setIsAdmin(isAdmin);
        });
      })
      .catch(() => {
        setAuth(false);
        clear();
        deleteCookie(REFRESH_TOKEN);
      })
      .finally(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};
