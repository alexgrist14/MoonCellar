import { useRouter } from "next/router";
import { authAPI, userAPI } from "../api";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constants";
import { useAuthStore } from "../store/auth.store";
import { IAuth } from "../types/auth";
import { IAxiosErrorResponse } from "../types/common.type";
import { modal } from "../ui/Modal";
import { axiosUtils } from "../utils/axios";
import { deleteCookie } from "../utils/cookies";

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

  const login = async (data: Omit<IAuth, "userName">) => {
    return authAPI
      .login(data)
      .then((response) => {
        authUpdate(response.data.userId);
      })
      .catch((e: IAxiosErrorResponse) => {
        axiosUtils.toastError(e);
        throw new Error;
      });
  };

  const signup = async (data: IAuth) => {
    return authAPI
      .signup(data)
      .then((response) => {
        authUpdate(response.data.userId);
      })
      .catch((e: IAxiosErrorResponse) => {
        axiosUtils.toastError(e);
        throw new Error;
      });
  };

  return { logout, login, signup, authUpdate };
};
