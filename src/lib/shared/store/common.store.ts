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
  systems?: IGDBPlatform[];
  families?: IGDBFamily[];
  genres?: IGDBGenre[];
  gameModes?: IGDBDefault[];
  themes?: IGDBDefault[];
  expanded?: "left" | "right" | "both" | "none";
};

type IAction = {
  setGameModes: (modes: IGDBDefault[]) => void;
  setThemes: (themes: IGDBDefault[]) => void;
  setGenres: (genres: IGDBGenre[]) => void;
  setFamilies: (families: IGDBFamily[]) => void;
  setSystems: (platforms: IGDBPlatform[]) => void;
  setExpanded: (expanded: "left" | "right" | "both" | "none") => void;
};

export const useCommonStore = create<IState & IAction>()(
  devtools(
    (set) => ({
      setGenres: (genres) => set({ genres }),
      setExpanded: (expanded) => set({ expanded }),
      setSystems: (systems) => set({ systems }),
      setFamilies: (families) => set({ families }),
      setGameModes: (modes) => set({ gameModes: modes }),
      setThemes: (themes) => set({ themes }),
    }),
    {
      name: "common",
    }
  )
);
