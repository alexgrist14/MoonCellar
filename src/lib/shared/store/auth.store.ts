import { create } from "zustand";
import { persist, devtools } from "zustand/middleware";

type IState = {
  isLoading?: boolean;
  isAuth?: boolean;
};

type IAction = {
  setLoading: (isLoading: boolean) => void;
  setAuth: (isAuth: boolean) => void;
  clear: () => void;
};

export const useAuthStore = create<IState & IAction>()(
  devtools(
    persist(
      (set) => ({
        isLoading: false,
        isAuth: false,
        setLoading: (isLoading) => set({ isLoading }),
        setAuth: (isAuth) => set({ isAuth }),
        clear: () => {
          // deleteCookie('');
          set({
            isLoading: true,
            isAuth: false,
          });
        },
      }),
      { name: "auth" }
    )
  )
);
