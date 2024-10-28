import { create } from "zustand";
import { persist, devtools } from "zustand/middleware";

type IState = {
  isLoading?: boolean;
  isAuth?: boolean;
  userId?: string;
  profilePicture?: string;
};

type IAction = {
  setLoading: (isLoading: boolean) => void;
  setAuth: (isAuth: boolean) => void;
  setUserId: (userId: string) => void;
  setProfilePicture:(profilePicture: string) => void;
  clear: () => void;
};

export const useAuthStore = create<IState & IAction>()(
  devtools(
    persist(
      (set) => ({
        isLoading: false,
        isAuth: false,
        userId: "",
        profilePicture: "",
        setLoading: (isLoading) => set({ isLoading }),
        setAuth: (isAuth) => set({ isAuth }),
        setUserId: (userId) => set({userId}),
        setProfilePicture: (profilePicture) => set({profilePicture}),
        clear: () => {
          set({
            isLoading: true,
            isAuth: false,
            userId: "",
            profilePicture: "",
          });
        },
      }),
      { name: "auth" }
    )
  )
);
