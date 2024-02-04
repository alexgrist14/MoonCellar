import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { IIGDBGame } from "../interfaces";
import { IGame } from "../interfaces/responses";

const initialState: {
  apiType: "RA" | "IGDB";
  winner?: IIGDBGame | IGame;
  royalGamesRA: IGame[];
  royalGamesIGDB: IIGDBGame[];
  systemsRA: number[];
  systemsIGDB: number[];
  isRoyal: boolean;
} = {
  apiType: "RA",
  royalGamesRA: [],
  royalGamesIGDB: [],
  winner: undefined,
  systemsRA: [],
  systemsIGDB: [],
  isRoyal: false,
};

export const commonSlice = createSlice({
  name: "common",
  initialState,
  reducers: {
    setApiType: (state, action: PayloadAction<"RA" | "IGDB">) => {
      state.apiType = action.payload;
    },
    setRoyalGamesRA: (state, action: PayloadAction<IGame[]>) => {
      state.royalGamesRA = action.payload;
    },
    setRoyalGamesIGDB: (state, action: PayloadAction<IIGDBGame[]>) => {
      state.royalGamesIGDB = action.payload;
    },
    setSystemsRA: (state, action: PayloadAction<number[]>) => {
      state.systemsRA = action.payload;
    },
    setSystemsIGDB: (state, action: PayloadAction<number[]>) => {
      state.systemsIGDB = action.payload;
    },
    setWinner: (
      state,
      action: PayloadAction<IIGDBGame | IGame | undefined>
    ) => {
      state.winner = action.payload;
    },
    setRoyal: (state, action: PayloadAction<boolean>) => {
      state.isRoyal = action.payload;
    },
  },
});

export const {
  setWinner,
  setApiType,
  setRoyalGamesRA,
  setRoyalGamesIGDB,
  setSystemsIGDB,
  setSystemsRA,
  setRoyal,
} = commonSlice.actions;
export default commonSlice.reducer;
