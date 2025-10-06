import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { IPlatform } from "../lib/schemas/platforms.schema";

export type IExpandPosition = "left" | "right" | "bottom-left" | "bottom-right";
export type IScrollPosition ={[key: string]: { top: number; left: number }} | undefined;

type IState = {
  systems?: IPlatform[];
  families?: string[];
  genres?: string[];
  gameModes?: string[];
  themes?: string[];
  keywords?: string[];
  gameTypes?: string[];
  companies?: string[];
  timer: number;
  scrollPosition?:  IScrollPosition| undefined;
};

type IAction = {
  setGameModes: (modes: string[]) => void;
  setThemes: (themes: string[]) => void;
  setKeywords: (themes: string[]) => void;
  setGameTypes: (gameTypes: string[]) => void;
  setGenres: (genres: string[]) => void;
  setFamilies: (families: string[]) => void;
  setSystems: (platforms: IPlatform[]) => void;
  setTimer: (timer: number) => void;
  setCompanies: (companies: string[]) => void;
  setScrollPosition: (
    scrollPosition: IScrollPosition | undefined
  ) => void;
};

export const useCommonStore = create<IState & IAction>()(
  devtools(
    (set) => ({
      timer: 3,
      setGenres: (genres) => set({ genres }),
      setSystems: (systems) => set({ systems }),
      setFamilies: (families) => set({ families }),
      setGameModes: (modes) => set({ gameModes: modes }),
      setGameTypes: (gameTypes) => set({ gameTypes }),
      setThemes: (themes) => set({ themes }),
      setKeywords: (keywords) => set({ keywords }),
      setCompanies: (companies) => set({ companies }),
      setTimer: (timer) => set({ timer }),
      setScrollPosition: (scrollPosition) => set({ scrollPosition }),
    }),
    {
      name: "common",
    }
  )
);
