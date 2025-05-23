import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { screenMd } from "../constants";
import { commonUtils } from "../utils/common";

type IState = {
  isLoading?: boolean;
  isPlatformsLoading?: boolean;
  isStarted?: boolean;
  isFinished: boolean;
  isRoyal?: boolean;
  isHistory?: boolean;
  isExcludeHistory: boolean;
  isMobile?: boolean;
};

type IAction = {
  setLoading: (isLoading: boolean) => void;
  setPlatformsLoading: (isPlatformsLoading: boolean) => void;
  setStarted: (isStarted: boolean) => void;
  setFinished: (isFinished: boolean) => void;
  setRoyal: (royal: boolean) => void;
  setHistory: (isHistory: boolean) => void;
  setExcludeHistory: (isExcludeHistory: boolean) => void;
  setMobile: (isMobile: boolean | undefined) => void;
};

export const useStatesStore = create<IState & IAction>()(
  devtools(
    (set) => ({
      isFinished: true,
      isExcludeHistory: false,
      setFinished: (isFinished) => set({ isFinished }),
      setLoading: (isLoading) => set({ isLoading }),
      setPlatformsLoading: (isPlatformsLoading) => set({ isPlatformsLoading }),
      setStarted: (isStarted) => set({ isStarted }),
      setRoyal: (isRoyal) => set({ isRoyal }),
      setHistory: (isHistory) => set({ isHistory }),
      setExcludeHistory: (isExcludeHistory) => set({ isExcludeHistory }),
      setMobile: (isMobile) => set({ isMobile }),
      clear: () =>
        set({
          isFinished: true,
          isLoading: false,
          isPlatformsLoading: false,
          isStarted: false,
        }),
    }),
    { name: "states" }
  )
);
