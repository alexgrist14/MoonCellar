import { create } from "zustand";
import { persist, devtools } from "zustand/middleware";
import { IUser } from "../types/auth";

type IState = {
  isAuth?: boolean;
  userName?: string;
  userId?: string;
  profilePicture?: string;
  profile?: IUser;
};

type IAction = {
  setAuth: (isAuth: boolean) => void;
  setUserName: (userName: string) => void;
  setUserId: (userId: string) => void;
  setProfilePicture: (profilePicture: string) => void;
  setProfile: (user: IUser) => void;
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
        setProfile: (profile) => set({ profile }),
        clear: () => {
          set({
            isAuth: false,
            userName: undefined,
            userId: undefined,
            profilePicture: undefined,
          });
        },
      }),
      { name: "auth" }
    )
  )
);
