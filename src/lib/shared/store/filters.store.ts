import { create } from "zustand";
import { persist, devtools } from "zustand/middleware";
import { IGDBDefault, IGDBGenre, IGDBPlatform } from "../types/igdb";
import { gameCategories } from "../constants";

type IState = {
  selectedSystems?: IGDBPlatform[];
  selectedGenres?: IGDBGenre[];
  selectedGameModes?: IGDBDefault[];
  selectedGeneration?: number;
  selectedRating?: number;
  selectedVotes?: number;
  searchQuery?: string;
  searchCompany?: string;
  excludedSystems?: IGDBPlatform[];
  excludedGenres?: IGDBGenre[];
  excludedGameModes?: IGDBDefault[];
  selectedCategories?: (keyof typeof gameCategories)[];
  selectedYears?: [number, number];
  selectedThemes?: IGDBDefault[];
  excludedThemes?: IGDBDefault[];
  isExcludeHistory: boolean;
};

type IAction = {
  setSelectedGameModes: (gameModes: IGDBDefault[]) => void;
  setSelectedSystems: (selectedSystems: IGDBPlatform[]) => void;
  setSelectedGenres: (selectedGenres: IGDBGenre[]) => void;
  setSelectedRating: (selectedRating: number) => void;
  setSelectedVotes: (selectedVotes: number) => void;
  setSelectedGeneration: (selectedGeneration: number) => void;
  setSearchQuery: (searchQuery: string) => void;
  setSearchCompany: (searchCompany: string) => void;
  setExcludedGameModes: (gameModes: IGDBDefault[]) => void;
  setExcludedSystems: (excludedSystems: IGDBPlatform[]) => void;
  setExcludedGenres: (excludedGenres: IGDBGenre[]) => void;
  setSelectedCategories: (categories: (keyof typeof gameCategories)[]) => void;
  setSelectedYears: (selectedYears: [number, number]) => void;
  setSelectedThemes: (selectedThemes: IGDBDefault[]) => void;
  setExcludedThemes: (excludedThemes: IGDBDefault[]) => void;
  setExcludeHistory: (isExcludeHistory: boolean) => void;
  clear: () => void;
};

const getActions = (set: any): IAction & IState => ({
  isExcludeHistory: false,
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSearchCompany: (searchCompany) => set({ searchCompany }),
  setSelectedGameModes: (selectedGameModes) => set({ selectedGameModes }),
  setSelectedGeneration: (selectedGeneration) => set({ selectedGeneration }),
  setSelectedGenres: (selectedGenres) => set({ selectedGenres }),
  setSelectedRating: (selectedRating) => set({ selectedRating }),
  setSelectedVotes: (selectedVotes) => set({ selectedVotes }),
  setSelectedSystems: (selectedSystems) => set({ selectedSystems }),
  setExcludedGameModes: (excludedGameModes) => set({ excludedGameModes }),
  setExcludedGenres: (excludedGenres) => set({ excludedGenres }),
  setExcludedSystems: (excludedSystems) => set({ excludedSystems }),
  setSelectedCategories: (selectedCategories) => set({ selectedCategories }),
  setSelectedYears: (selectedYears) => set({ selectedYears }),
  setSelectedThemes: (selectedThemes) => set({ selectedThemes }),
  setExcludedThemes: (excludedThemes) => set({ excludedThemes }),
  setExcludeHistory: (isExcludeHistory) => set({ isExcludeHistory }),
  clear: () => {
    set({
      selectedSystems: undefined,
      selectedGenres: undefined,
      selectedGameModes: undefined,
      selectedGeneration: undefined,
      selectedRating: undefined,
      searchQuery: undefined,
      searchCompany: undefined,
      excludedSystems: undefined,
      excludedGenres: undefined,
      excludedGameModes: undefined,
      selectedCategories: undefined,
      selectedYears: undefined,
      selectedThemes: undefined,
      excludedThemes: undefined,
      selectedVotes: undefined,
      isExcludeHistory: false,
    });
  },
});

export const useGauntletFiltersStore = create<IState & IAction>()(
  devtools(
    persist((set) => getActions(set), {
      name: "gauntletFilters",
    })
  )
);

export const useGamesFiltersStore = create<IState & IAction>()(
  devtools(persist((set) => getActions(set), { name: "gamesFilters" }))
);
