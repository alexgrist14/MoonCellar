import { create } from "zustand";
import { persist, devtools } from "zustand/middleware";
import { IGDBDefault, IGDBGenre, IGDBPlatform } from "../types/igdb";

type IState = {
  excludedSystems?: IGDBPlatform[];
  excludedGenres?: IGDBGenre[];
  excludedGameModes?: IGDBDefault[];
};

type IAction = {
  setExcludedGameModes: (gameModes: IGDBDefault[]) => void;
  setExcludedSystems: (excludedSystems: IGDBPlatform[]) => void;
  setExcludedGenres: (excludedGenres: IGDBGenre[]) => void;
};

export const useExcludedStore = create<IState & IAction>()(
  devtools(
    persist(
      (set) => ({
        setExcludedGameModes: (excludedGameModes) => set({ excludedGameModes }),
        setExcludedGenres: (excludedGenres) => set({ excludedGenres }),
        setExcludedSystems: (excludedSystems) => set({ excludedSystems }),
      }),
      { name: "excluded" },
    ),
  ),
);
