import { create } from "zustand";
import { devtools } from "zustand/middleware";
import {
  IGDBDefault,
  IGDBFamily,
  IGDBGenre,
  IGDBPlatform,
} from "../types/igdb";

type IState = {
  systems?: IGDBPlatform[];
  families?: IGDBFamily[];
  genres?: IGDBGenre[];
  gameModes?: IGDBDefault[];
  themes?: IGDBDefault[];
  keywords?: IGDBDefault[];
  expanded?: "left" | "right" | "both" | "none";
  timer: number;
};

type IAction = {
  setGameModes: (modes: IGDBDefault[]) => void;
  setThemes: (themes: IGDBDefault[]) => void;
  setKeywords: (themes: IGDBDefault[]) => void;
  setGenres: (genres: IGDBGenre[]) => void;
  setFamilies: (families: IGDBFamily[]) => void;
  setSystems: (platforms: IGDBPlatform[]) => void;
  setExpanded: (expanded: "left" | "right" | "both" | "none") => void;
  setTimer: (timer: number) => void;
};

export const useCommonStore = create<IState & IAction>()(
  devtools(
    (set) => ({
      timer: 3,
      setGenres: (genres) => set({ genres }),
      setExpanded: (expanded) => set({ expanded }),
      setSystems: (systems) => set({ systems }),
      setFamilies: (families) => set({ families }),
      setGameModes: (modes) => set({ gameModes: modes }),
      setThemes: (themes) => set({ themes }),
      setKeywords: (keywords) => set({ keywords }),
      setTimer: (timer) => set({ timer }),
    }),
    {
      name: "common",
    }
  )
);
