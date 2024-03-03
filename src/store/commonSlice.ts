import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { IGame } from "../interfaces/game";
import {
  IGDBDefault,
  IIGDBGenre,
  IIGDBPlatform,
  IIGDBPlatformFamily,
} from "../interfaces";
import { IConsole } from "../interfaces/responses";

const initialState: {
  winner?: IGame;
  systemsRA: IConsole[];
  systemsIGDB: IIGDBPlatform[];
  IGDBFamilies: IIGDBPlatformFamily[];
  genres: IIGDBGenre[];
  gameModes: IGDBDefault[];
} = {
  winner: undefined,
  systemsRA: [],
  systemsIGDB: [],
  IGDBFamilies: [],
  genres: [],
  gameModes: [],
};

export const commonSlice = createSlice({
  name: "common",
  initialState,
  reducers: {
    setGameModes: (state, action: PayloadAction<IGDBDefault[]>) => {
      state.gameModes = action.payload;
    },
    setSystemsRA: (state, action: PayloadAction<IConsole[]>) => {
      state.systemsRA = action.payload;
    },
    setSystemsIGDB: (state, action: PayloadAction<IIGDBPlatform[]>) => {
      state.systemsIGDB = action.payload;
    },
    setIGDBFamilies: (state, action: PayloadAction<IIGDBPlatformFamily[]>) => {
      state.IGDBFamilies = action.payload;
    },
    setWinner: (state, action: PayloadAction<IGame | undefined>) => {
      state.winner = action.payload;
    },
    setGenres: (state, action: PayloadAction<IIGDBGenre[]>) => {
      state.genres = action.payload;
    },
  },
});

export const {
  setWinner,
  setSystemsIGDB,
  setSystemsRA,
  setGenres,
  setGameModes,
  setIGDBFamilies,
} = commonSlice.actions;
export default commonSlice.reducer;
