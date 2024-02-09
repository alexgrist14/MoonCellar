import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { IGame } from "../interfaces/game";
import { IGDBDefault, IIGDBGenre, IIGDBPlatform } from "../interfaces";
import { IConsole } from "../interfaces/responses";

const initialState: {
  apiType: "RA" | "IGDB";
  royalGamesRA: IGame[];
  royalGamesIGDB: IGame[];
  selectedSystemsRA: IConsole[];
  selectedSystemsIGDB: IIGDBPlatform[];
  isRoyal: boolean;
  selectedGenres: IIGDBGenre[];
  selectedGameModes: IGDBDefault[];
  isOnlyWithAchievements: boolean;
  selectedGeneration: number;
  selectedRating: number;
} = {
  apiType: "RA",
  royalGamesRA: [],
  royalGamesIGDB: [],
  selectedSystemsRA: [],
  selectedSystemsIGDB: [],
  selectedGenres: [],
  selectedGameModes: [],
  isRoyal: false,
  isOnlyWithAchievements: true,
  selectedGeneration: 9,
  selectedRating: 0,
};

export const selectedSlice = createSlice({
  name: "selected",
  initialState,
  reducers: {
    setApiType: (state, action: PayloadAction<"RA" | "IGDB">) => {
      state.apiType = action.payload;
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
    setSelectedSystemsIGDB: (state, action: PayloadAction<IIGDBPlatform[]>) => {
      state.selectedSystemsIGDB = action.payload;
    },
    setRoyal: (state, action: PayloadAction<boolean>) => {
      state.isRoyal = action.payload;
    },
    setSelectedGenres: (state, action: PayloadAction<IIGDBGenre[]>) => {
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
  },
});

export const {
  setApiType,
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
} = selectedSlice.actions;
export default selectedSlice.reducer;
