import { jwtDecode } from "jwt-decode";
import { useAuthStore } from "../store/auth.store";
import { deleteCookie, setCookie } from "../utils/cookies";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constants";
import { authAPI, userAPI } from "../api";
import { IAuth } from "../types/auth";
import { isTokenExpired } from "../utils/token";
import { useRouter } from "next/router";
import { axiosUtils } from "../utils/axios";
import { modal } from "../ui/Modal";
import { IAxiosErrorResponse } from "../types/common.type";

export const useAuth = () => {
  const { clear, setProfile, setAuth } = useAuthStore();
  const { push } = useRouter();

  const logout = (id: string) => {
    authAPI
      .logout(id)
      .then(() => {})
      .catch(() => {})
      .finally(() => {
        push("/");
        deleteCookie(ACCESS_TOKEN);
        deleteCookie(REFRESH_TOKEN);
        clear();
      });
  };
  const authUpdate = (userId: string) => {
    setAuth(true);
    userAPI.getById(userId).then((res) => {
      setProfile(res.data);
      modal.close();
    });
  };

  const login = (data: Omit<IAuth, "userName">) => {
    authAPI
      .login(data)
      .then((response) => {
        authUpdate(response.data.userId);
      })
      .catch((e: IAxiosErrorResponse) => {
        axiosUtils.toastError(e);
      });
  };

  const signup = (data: IAuth) => {
    authAPI
      .signup(data)
      .then((response) => {
        authUpdate(response.data.userId);
      })
      .catch((e: IAxiosErrorResponse) => {
        axiosUtils.toastError(e);
      });
  };

  return { logout, login, signup };
};
