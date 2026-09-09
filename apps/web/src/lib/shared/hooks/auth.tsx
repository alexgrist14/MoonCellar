import { useRouter } from "next/navigation";
import { authAPI, userAPI } from "../api";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constants";
import { useAuthStore } from "../store/auth.store";
import { IAuth } from "../types/auth.type";
import { modal } from "../ui/Modal";
import { deleteCookie } from "../utils/cookies.utils";
import { useUserStore } from "../store/user.store";

export const useAuth = () => {
  const { clear, setProfile, setAuth } = useAuthStore();
  const { setPlaythroughs } = useUserStore();
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
        setPlaythroughs(undefined);
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
    return authAPI.login(data).then((response) => {
      authUpdate(response.data.userId);
    });
  };

  const signup = async (data: IAuth) => {
    return authAPI.signup(data).then((response) => {
      authUpdate(response.data.userId);
    });
  };

  return { logout, login, signup, authUpdate };
};
