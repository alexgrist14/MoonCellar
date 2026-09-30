import { useAuthStore } from "@/src/lib/shared/store/auth.store";
import { authAPI, userAPI } from "@/src/lib/shared/api";
import { deleteCookie } from "@/src/lib/shared/utils/cookies.utils";
import { REFRESH_TOKEN } from "@/src/lib/shared/constants";
import { useEffect } from "react";

export const refreshAuth = () => {
  const { setAuth, clear, setProfile, setIsAdmin, setAuthChecked } =
    useAuthStore.getState();

  return authAPI
    .refreshToken()
    .then((res) => {
      setAuth(true);

      return userAPI
        .getById(res.data.userId)
        .then((res) => {
          const isAdmin = !!res.data.roles?.includes("admin");

          setProfile(res.data);
          setIsAdmin(isAdmin);
        })
        .catch(() => undefined);
    })
    .catch(() => {
      setAuth(false);
      clear();
      deleteCookie(REFRESH_TOKEN);
    })
    .finally(() => setAuthChecked(true));
};

export const useAuthRefresh = () =>
  useEffect(() => {
    const { isAuth, setAuthChecked } = useAuthStore.getState();

    if (!isAuth) {
      setAuthChecked(true);
      return;
    }

    refreshAuth();
  }, []);
