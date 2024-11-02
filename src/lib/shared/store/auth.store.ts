import { create } from "zustand";
import { persist, devtools } from "zustand/middleware";

type IState = {
  isLoading?: boolean;
  isAuth?: boolean;
  userName?: string;
  userId?: string;
  profilePicture?: string;
};

type IAction = {
  setLoading: (isLoading: boolean) => void;
  setAuth: (isAuth: boolean) => void;
  setUserName: (userName: string) => void;
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
        userName: "",
        profilePicture: "",
        setLoading: (isLoading) => set({ isLoading }),
        setAuth: (isAuth) => set({ isAuth }),
        setUserName: (userName) => set({userName}),
        setUserId: (userId) => set({userId}),
        setProfilePicture: (profilePicture) => set({profilePicture}),
        clear: () => {
          set({
            isLoading: true,
            isAuth: false,
            userName: "",
            userId: "",
            profilePicture: "",
          });
        },
      }),
      { name: "auth" }
    )
  )
);
