import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { IUser } from "../types/auth.type";

type IState = {
  isAuth?: boolean;
  isAdmin?: boolean;
  profile?: IUser;
};

type IAction = {
  setAuth: (isAuth: boolean) => void;
  setIsAdmin: (isAdmin: boolean) => void;
  setProfile: (user: IUser) => void;
  clear: () => void;
};

export const useAuthStore = create<IState & IAction>()(
  devtools(
    persist(
      (set) => ({
        isAuth: false,
        setAuth: (isAuth) => set({ isAuth }),
        setIsAdmin: (isAdmin) => set({ isAdmin }),
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
