import { create } from "zustand";
import { persist, devtools } from "zustand/middleware";
import {
  IGDBDefault,
  IGDBGameMinimal,
  IGDBGenre,
  IGDBPlatform,
} from "../types/igdb";

type IState = {
  games?: IGDBGameMinimal[];
  royalGames?: IGDBGameMinimal[];
  selectedSystems?: IGDBPlatform[];
  selectedGenres?: IGDBGenre[];
  selectedGameModes?: IGDBDefault[];
  selectedGeneration?: number;
  selectedRating?: number;
  searchQuery?: string;
  excludedSystems?: IGDBPlatform[];
  excludedGenres?: IGDBGenre[];
  excludedGameModes?: IGDBDefault[];
};

type IAction = {
  setGames: (games: IGDBGameMinimal[]) => void;
  setSelectedGameModes: (gameModes: IGDBDefault[]) => void;
  setRoyalGames: (royalGames: IGDBGameMinimal[]) => void;
  setSelectedSystems: (selectedSystems: IGDBPlatform[]) => void;
  setSelectedGenres: (selectedGenres: IGDBGenre[]) => void;
  setSelectedRating: (selectedRating: number) => void;
  setSelectedGeneration: (selectedGeneration: number) => void;
  setSearchQuery: (searchQuery: string) => void;
  setExcludedGameModes: (gameModes: IGDBDefault[]) => void;
  setExcludedSystems: (excludedSystems: IGDBPlatform[]) => void;
  setExcludedGenres: (excludedGenres: IGDBGenre[]) => void;
  addRoyalGame: (game: IGDBGameMinimal) => void;
  removeRoyalGame: (game: IGDBGameMinimal) => void;
};

const getActions = (set: any): IAction => ({
  setGames: (games) => set({ games }),
  setRoyalGames: (royalGames) => set({ royalGames }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSelectedGameModes: (selectedGameModes) => set({ selectedGameModes }),
  setSelectedGeneration: (selectedGeneration) => set({ selectedGeneration }),
  setSelectedGenres: (selectedGenres) => set({ selectedGenres }),
  setSelectedRating: (selectedRating) => set({ selectedRating }),
  setSelectedSystems: (selectedSystems) => set({ selectedSystems }),
  setExcludedGameModes: (excludedGameModes) => set({ excludedGameModes }),
  setExcludedGenres: (excludedGenres) => set({ excludedGenres }),
  setExcludedSystems: (excludedSystems) => set({ excludedSystems }),
  addRoyalGame: (game) =>
    set((state: IState) => ({
      royalGames: [
        ...(!!state.royalGames?.length ? state.royalGames : []),
        game,
      ],
    })),
  removeRoyalGame: (game) =>
    set((state: IState) => ({
      royalGames: !!state.royalGames?.length
        ? state.royalGames.filter((royal) => royal._id !== game._id)
        : undefined,
    })),
});

export const useGauntletFiltersStore = create<IState & IAction>()(
  devtools(persist((set) => getActions(set), { name: "gauntletFilters" }))
);

export const useGamesFiltersStore = create<IState & IAction>()(
  devtools(persist((set) => getActions(set), { name: "gamesFilters" }))
);
