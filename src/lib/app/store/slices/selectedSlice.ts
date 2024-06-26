import { IGame } from "@/src/lib/shared/types/game";
import {
  IGDBDefault,
  IGDBGenre,
  IGDBPlatform,
} from "@/src/lib/shared/types/igdb";
import { IConsole } from "@/src/lib/shared/types/responses";
import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

const initialState: {
  apiType: string;
  games: IGame[];
  royalGamesRA: IGame[];
  royalGamesIGDB: IGame[];
  selectedSystemsRA: IConsole[];
  selectedSystemsIGDB: IGDBPlatform[];
  isRoyal: boolean;
  selectedGenres: IGDBGenre[];
  selectedGameModes: IGDBDefault[];
  isOnlyWithAchievements: boolean;
  selectedGeneration: number;
  selectedRating: number;
  searchQuery: string;
} = {
  apiType: "RA",
  games: [],
  royalGamesRA: [],
  royalGamesIGDB: [],
  selectedSystemsRA: [],
  selectedSystemsIGDB: [],
  selectedGenres: [],
  selectedGameModes: [],
  isRoyal: false,
  isOnlyWithAchievements: true,
  selectedGeneration: 0,
  selectedRating: 0,
  searchQuery: "",
};

export const selectedSlice = createSlice({
  name: "selected",
  initialState,
  reducers: {
    setApiType: (state, action: PayloadAction<string>) => {
      state.apiType = action.payload;
    },
    setGames: (state, action: PayloadAction<IGame[]>) => {
      state.games = action.payload;
    },
    setSelectedGameModes: (state, action: PayloadAction<IGDBDefault[]>) => {
      state.selectedGameModes = action.payload;
    },
    setRoyalGamesRA: (state, action: PayloadAction<IGame[]>) => {
      state.royalGamesRA = action.payload;
    },
    setRoyalGamesIGDB: (state, action: PayloadAction<IGame[]>) => {
      state.royalGamesIGDB = action.payload;
    },
    setSelectedSystemsRA: (state, action: PayloadAction<IConsole[]>) => {
      state.selectedSystemsRA = action.payload;
    },
    setSelectedSystemsIGDB: (state, action: PayloadAction<IGDBPlatform[]>) => {
      state.selectedSystemsIGDB = action.payload;
    },
    setRoyal: (state, action: PayloadAction<boolean>) => {
      state.isRoyal = action.payload;
    },
    setSelectedGenres: (state, action: PayloadAction<IGDBGenre[]>) => {
      state.selectedGenres = action.payload;
    },
    setOnlyWithAchievements: (state, action: PayloadAction<boolean>) => {
      state.isOnlyWithAchievements = action.payload;
    },
    setSelectedRating: (state, action: PayloadAction<number>) => {
      state.selectedRating = action.payload;
    },
    setSelectedGeneration: (state, action: PayloadAction<number>) => {
      state.selectedGeneration = action.payload;
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
  },
});

export const {
  setApiType,
  setGames,
  setRoyalGamesRA,
  setRoyalGamesIGDB,
  setRoyal,
  setOnlyWithAchievements,
  setSelectedGameModes,
  setSelectedGenres,
  setSelectedSystemsIGDB,
  setSelectedSystemsRA,
  setSelectedGeneration,
  setSelectedRating,
  setSearchQuery,
} = selectedSlice.actions;
export default selectedSlice.reducer;
