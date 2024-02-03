import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { IIGDBGame } from "../interfaces";

const initialState: {
  isLoading: boolean;
  isStarted: boolean;
  isFinished: boolean;
  apiType: "RA" | "IGDB" | "Royal";
  royalGames: IIGDBGame[];
  winner?: IIGDBGame;
} = {
  isLoading: false,
  isStarted: false,
  isFinished: false,
  apiType: "RA",
  royalGames: [],
  winner: undefined,
};

export const commonSlice = createSlice({
  name: "common",
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setStarted: (state, action: PayloadAction<boolean>) => {
      state.isStarted = action.payload;
    },
    setFinished: (state, action: PayloadAction<boolean>) => {
      state.isFinished = action.payload;
    },
    setApiType: (state, action: PayloadAction<"RA" | "IGDB" | "Royal">) => {
      state.apiType = action.payload;
    },
    setRoyalGames: (state, action: PayloadAction<IIGDBGame[]>) => {
      state.royalGames = action.payload;
    },
    setWinner: (state, action: PayloadAction<IIGDBGame | undefined>) => {
      state.winner = action.payload;
    },
  },
});

export const {
  setWinner,
  setLoading,
  setStarted,
  setFinished,
  setApiType,
  setRoyalGames,
} = commonSlice.actions;
export default commonSlice.reducer;
