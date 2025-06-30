import { create } from "zustand";
import { devtools } from "zustand/middleware";
import {
  IGDBDefault,
  IGDBFamily,
  IGDBGameType,
  IGDBGenre,
  IGDBPlatform,
} from "../types/igdb";

export type IExpandPosition = "left" | "right" | "bottom-left" | "bottom-right";

type IState = {
  systems?: IGDBPlatform[];
  families?: IGDBFamily[];
  genres?: IGDBGenre[];
  gameModes?: IGDBDefault[];
  themes?: IGDBDefault[];
  keywords?: IGDBDefault[];
  gameTypes?: IGDBGameType[];
  timer: number;
  scrollPosition?: { top: number; left: number } | undefined;
};

type IAction = {
  setGameModes: (modes: IGDBDefault[]) => void;
  setThemes: (themes: IGDBDefault[]) => void;
  setKeywords: (themes: IGDBDefault[]) => void;
  setGameTypes: (gameTypes: IGDBGameType[]) => void;
  setGenres: (genres: IGDBGenre[]) => void;
  setFamilies: (families: IGDBFamily[]) => void;
  setSystems: (platforms: IGDBPlatform[]) => void;
  setTimer: (timer: number) => void;
  setScrollPosition: (
    scrollPosition: { top: number; left: number } | undefined
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
      setTimer: (timer) => set({ timer }),
      setScrollPosition: (scrollPosition) => set({ scrollPosition }),
    }),
    {
      name: "common",
    }
  )
);
