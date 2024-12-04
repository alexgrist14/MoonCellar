import { create } from "zustand";
import { devtools } from "zustand/middleware";
import {
  IGDBDefault,
  IGDBFamily,
  IGDBGameMinimal,
  IGDBGenre,
  IGDBPlatform,
} from "../types/igdb";

type IState = {
  winner?: IGDBGameMinimal;
  systems?: IGDBPlatform[];
  families?: IGDBFamily[];
  genres?: IGDBGenre[];
  gameModes?: IGDBDefault[];
  themes?: IGDBDefault[];
  expandPosition?: "left" | "right";
  expanded?: "left" | "right" | "both" | "none";
  isMobile?: boolean;
};

type IAction = {
  setGameModes: (modes: IGDBDefault[]) => void;
  setThemes: (themes: IGDBDefault[]) => void;
  setGenres: (genres: IGDBGenre[]) => void;
  setFamilies: (families: IGDBFamily[]) => void;
  setSystems: (platforms: IGDBPlatform[]) => void;
  setWinner: (game: IGDBGameMinimal | undefined) => void;
  setExpandPosition: (position: "left" | "right" | undefined) => void;
  setExpanded: (expanded: "left" | "right" | "both" | "none") => void;
  setIsMobile: (isMobile: boolean | undefined) => void;
};

export const useCommonStore = create<IState & IAction>()(
  devtools(
    (set) => ({
      setGenres: (genres) => set({ genres }),
      setExpanded: (expanded) => set({ expanded }),
      setIsMobile: (isMobile) => set({ isMobile }),
      setSystems: (systems) => set({ systems }),
      setWinner: (winner) => set({ winner }),
      setFamilies: (families) => set({ families }),
      setExpandPosition: (position) => set({ expandPosition: position }),
      setGameModes: (modes) => set({ gameModes: modes }),
      setThemes: (themes) => set({ themes }),
    }),
    {
      name: "common",
    }
  )
);
