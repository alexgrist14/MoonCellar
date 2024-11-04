import { create } from "zustand";
import { persist, devtools } from "zustand/middleware";
import { IUser } from "../types/auth";

type IState = {
  isAuth?: boolean;
  profile?: IUser;
};

type IAction = {
  setAuth: (isAuth: boolean) => void;
  setProfile: (user: IUser) => void;
  clear: () => void;
};

export const useAuthStore = create<IState & IAction>()(
  devtools(
    persist(
      (set) => ({
        isAuth: false,
        setAuth: (isAuth) => set({ isAuth }),
        setProfile: (profile) => set({ profile }),
        clear: () => {
          set({
            isAuth: false,
            profile: undefined,
          });
        },
      }),
      { name: "auth" }
    )
  )
);
