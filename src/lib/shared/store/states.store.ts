import { create } from "zustand";
import { devtools } from "zustand/middleware";

type IState = {
  isLoading?: boolean;
  isPlatformsLoading?: boolean;
  isStarted?: boolean;
  isFinished: boolean;
  isRoyal?: boolean;
  isHistory?: boolean;
  segments?: string[];
};

type IAction = {
  setLoading: (isLoading: boolean) => void;
  setPlatformsLoading: (isPlatformsLoading: boolean) => void;
  setStarted: (isStarted: boolean) => void;
  setFinished: (isFinished: boolean) => void;
  setRoyal: (royal: boolean) => void;
  setHistory: (isHistory: boolean) => void;
  setSegments: (segments: string[]) => void;
};

export const useStatesStore = create<IState & IAction>()(
  devtools(
    (set) => ({
      isFinished: true,
      setFinished: (isFinished) => set({ isFinished }),
      setLoading: (isLoading) => set({ isLoading }),
      setPlatformsLoading: (isPlatformsLoading) => set({ isPlatformsLoading }),
      setSegments: (segments) => set({ segments }),
      setStarted: (isStarted) => set({ isStarted }),
      setRoyal: (isRoyal) => set({ isRoyal }),
      setHistory: (isHistory) => set({ isHistory }),
    }),
    { name: "states" }
  )
);

