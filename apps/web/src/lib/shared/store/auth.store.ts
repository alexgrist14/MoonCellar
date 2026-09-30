import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { IUser } from "@/src/lib/shared/types/auth.type";

type IState = {
  isAuth?: boolean;
  isAdmin?: boolean;
  profile?: IUser;
  isAuthChecked: boolean;
};

type IAction = {
  setAuth: (isAuth: boolean) => void;
  setIsAdmin: (isAdmin: boolean) => void;
  setProfile: (user: IUser) => void;
  setAuthChecked: (isAuthChecked: boolean) => void;
  clear: () => void;
};

export const useAuthStore = create<IState & IAction>()(
  devtools(
    persist(
      (set) => ({
        isAuth: false,
        isAuthChecked: false,
        setAuth: (isAuth) => set({ isAuth }),
        setIsAdmin: (isAdmin) => set({ isAdmin }),
        setProfile: (profile) => set({ profile }),
        setAuthChecked: (isAuthChecked) => set({ isAuthChecked }),
        clear: () => {
          set({
            isAuth: false,
            isAdmin: false,
            profile: undefined,
          });
        },
      }),
      {
        name: "auth",
        partialize: ({ isAuthChecked: _isAuthChecked, ...state }) => state,
      }
    )
  )
);
