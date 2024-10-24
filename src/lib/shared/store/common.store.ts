import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { IGame } from "../types/game";
import {
  IGDBDefault,
  IGDBFamily,
  IGDBGenre,
  IGDBPlatform,
} from "../types/igdb";

type IState = {
  winner?: IGame;
  systems?: IGDBPlatform[];
  families?: IGDBFamily[];
  genres?: IGDBGenre[];
  gameModes?: IGDBDefault[];
  expandPosition?: "left" | "right";
  isMobile?: boolean;
};

type IAction = {
  setGameModes: (modes: IGDBDefault[]) => void;
  setGenres: (genres: IGDBGenre[]) => void;
  setFamilies: (families: IGDBFamily[]) => void;
  setSystems: (platforms: IGDBPlatform[]) => void;
  setWinner: (game: IGame | undefined) => void;
  setExpandPosition: (position: "left" | "right" | undefined) => void;
  setIsMobile: (isMobile: boolean | undefined) => void;
};

export const useCommonStore = create<IState & IAction>()(
  devtools(
    (set) => ({
      setGenres: (genres) => set({ genres }),
      setIsMobile: (isMobile) => set({ isMobile }),
      setSystems: (systems) => set({ systems }),
      setWinner: (winner) => set({ winner }),
      setFamilies: (families) => set({ families }),
      setExpandPosition: (position) => set({ expandPosition: position }),
      setGameModes: (modes) => set({ gameModes: modes }),
    }),
    {
      name: "common",
    }
  )
);
