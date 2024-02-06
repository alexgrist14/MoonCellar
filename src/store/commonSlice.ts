import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { IGame } from "../interfaces/game";

const initialState: {
  apiType: "RA" | "IGDB";
  winner?: IGame;
  games: IGame[];
  royalGames: IGame[];
  systemsRA: number[];
  systemsIGDB: number[];
  isRoyal: boolean;
  genres: number[];
} = {
  apiType: "RA",
  games: [],
  royalGames: [],
  winner: undefined,
  systemsRA: [],
  systemsIGDB: [],
  isRoyal: false,
  genres:[],
};

export const commonSlice = createSlice({
  name: "common",
  initialState,
  reducers: {
    setApiType: (state, action: PayloadAction<"RA" | "IGDB">) => {
      state.apiType = action.payload;
    },
    setGames: (state, action: PayloadAction<IGame[]>) => {
      state.games = action.payload;
    },
    setRoyalGames: (state, action: PayloadAction<IGame[]>) => {
      state.royalGames = action.payload;
    },
    setSystemsRA: (state, action: PayloadAction<number[]>) => {
      state.systemsRA = action.payload;
    },
    setSystemsIGDB: (state, action: PayloadAction<number[]>) => {
      state.systemsIGDB = action.payload;
    },
    setWinner: (state, action: PayloadAction<IGame | undefined>) => {
      state.winner = action.payload;
    },
    setRoyal: (state, action: PayloadAction<boolean>) => {
      state.isRoyal = action.payload;
    },
    setGenres:(state, action: PayloadAction<number[]>)=>{
      state.genres = action.payload;
    }
  },
});

export const {
  setWinner,
  setApiType,
  setGames,
  setRoyalGames,
  setSystemsIGDB,
  setSystemsRA,
  setRoyal,
  setGenres,
} = commonSlice.actions;
export default commonSlice.reducer;
