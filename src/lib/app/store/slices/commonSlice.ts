import { IGame } from "@/src/lib/shared/types/game";
import {
  IGDBDefault,
  IIGDBGenre,
  IIGDBPlatform,
  IIGDBPlatformFamily,
} from "@/src/lib/shared/types/igdb";
import { IConsole } from "@/src/lib/shared/types/responses";
import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

const initialState: {
  winner?: IGame;
  systemsRA: IConsole[];
  systemsIGDB: IIGDBPlatform[];
  IGDBFamilies: IIGDBPlatformFamily[];
  genres: IIGDBGenre[];
  gameModes: IGDBDefault[];
} = {
  IGDBFamilies: [],
  gameModes: [],
  genres: [],
  systemsIGDB: [],
  systemsRA: [],
  winner: undefined,
};

export const commonSlice = createSlice({
  initialState,
  name: "common",
  reducers: {
    setGameModes: (state, action: PayloadAction<IGDBDefault[]>) => {
      state.gameModes = action.payload;
    },
    setGenres: (state, action: PayloadAction<IIGDBGenre[]>) => {
      state.genres = action.payload;
    },
    setIGDBFamilies: (state, action: PayloadAction<IIGDBPlatformFamily[]>) => {
      state.IGDBFamilies = action.payload;
    },
    setSystemsIGDB: (state, action: PayloadAction<IIGDBPlatform[]>) => {
      state.systemsIGDB = action.payload;
    },
    setSystemsRA: (state, action: PayloadAction<IConsole[]>) => {
      state.systemsRA = action.payload;
    },
    setWinner: (state, action: PayloadAction<IGame | undefined>) => {
      state.winner = action.payload;
    },
  },
});

export const {
  setGameModes,
  setGenres,
  setIGDBFamilies,
  setSystemsIGDB,
  setSystemsRA,
  setWinner,
} = commonSlice.actions;
export default commonSlice.reducer;
