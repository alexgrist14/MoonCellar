import { create } from "zustand";
import { persist, devtools } from "zustand/middleware";

type IState = {
  isLoading?: boolean;
  isAuth?: boolean;
  userId?: string;
};

type IAction = {
  setLoading: (isLoading: boolean) => void;
  setAuth: (isAuth: boolean) => void;
  setUserId: (userId: string) => void;
  clear: () => void;
};

export const useAuthStore = create<IState & IAction>()(
  devtools(
    persist(
      (set) => ({
        isLoading: false,
        isAuth: false,
        userId: "",
        setLoading: (isLoading) => set({ isLoading }),
        setAuth: (isAuth) => set({ isAuth }),
        setUserId: (userId) => set({userId}),
        clear: () => {
          // deleteCookie('');
          set({
            isLoading: true,
            isAuth: false,
            userId: "",
          });
        },
      }),
      { name: "auth" }
    )
  )
);
