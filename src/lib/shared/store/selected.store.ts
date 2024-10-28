import { create } from "zustand";
import { persist, devtools } from "zustand/middleware";
import { IGDBDefault, IGDBGame, IGDBGenre, IGDBPlatform } from "../types/igdb";

type IState = {
  games?: IGDBGame[];
  royalGames?: IGDBGame[];
  selectedSystems?: IGDBPlatform[];
  isRoyal?: boolean;
  selectedGenres?: IGDBGenre[];
  selectedGameModes?: IGDBDefault[];
  selectedGeneration?: number;
  selectedRating?: number;
  searchQuery?: string;
};

type IAction = {
  setGames: (games: IGDBGame[]) => void;
  setSelectedGameModes: (gameModes: IGDBDefault[]) => void;
  setRoyalGames: (royalGames: IGDBGame[]) => void;
  setSelectedSystems: (selectedSystems: IGDBPlatform[]) => void;
  setRoyal: (royal: boolean) => void;
  setSelectedGenres: (selectedGenres: IGDBGenre[]) => void;
  setSelectedRating: (selectedRating: number) => void;
  setSelectedGeneration: (selectedGeneration: number) => void;
  setSearchQuery: (searchQuery: string) => void;
};

export const useSelectedStore = create<IState & IAction>()(
  devtools(
    persist(
      (set) => ({
        setGames: (games) => set({ games }),
        setRoyal: (isRoyal) => set({ isRoyal }),
        setRoyalGames: (royalGames) => set({ royalGames }),
        setSearchQuery: (searchQuery) => set({ searchQuery }),
        setSelectedGameModes: (selectedGameModes) => set({ selectedGameModes }),
        setSelectedGeneration: (selectedGeneration) =>
          set({ selectedGeneration }),
        setSelectedGenres: (selectedGenres) => set({ selectedGenres }),
        setSelectedRating: (selectedRating) => set({ selectedRating }),
        setSelectedSystems: (selectedSystems) => set({ selectedSystems }),
      }),
      { name: "selected" }
    )
  )
);