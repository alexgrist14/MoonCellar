import { create } from "zustand";
import { persist, devtools } from "zustand/middleware";

type IState = {
  isAuth?: boolean;
  userName?: string;
  userId?: string;
  profilePicture?: string;
};

type IAction = {
  setAuth: (isAuth: boolean) => void;
  setUserName: (userName: string) => void;
  setUserId: (userId: string) => void;
  setProfilePicture: (profilePicture: string) => void;
  clear: () => void;
};

export const useAuthStore = create<IState & IAction>()(
  devtools(
    persist(
      (set) => ({
        isAuth: false,
        setAuth: (isAuth) => set({ isAuth }),
        setUserName: (userName) => set({ userName }),
        setUserId: (userId) => set({ userId }),
        setProfilePicture: (profilePicture) => set({ profilePicture }),
        clear: () => {
          set({
            isAuth: false,
            userName: undefined,
            userId: undefined,
            profilePicture: undefined,
          });
        },
      }),
      { name: "auth" },
    ),
  ),
);
