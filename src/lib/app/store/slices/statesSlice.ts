import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

const initialState: {
  isLoading: boolean;
  isPlatformsLoading: boolean;
  isStarted: boolean;
  isFinished: boolean;
  segments: string[];
} = {
  isLoading: false,
  isPlatformsLoading: false,
  isStarted: false,
  isFinished: true,
  segments: Array(16).fill(""),
};

export const statesSlice = createSlice({
  name: "states",
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setPlatformsLoading: (state, action: PayloadAction<boolean>) => {
      state.isPlatformsLoading = action.payload;
    },
    setStarted: (state, action: PayloadAction<boolean>) => {
      state.isStarted = action.payload;
    },
    setFinished: (state, action: PayloadAction<boolean>) => {
      state.isFinished = action.payload;
    },
    setSegments: (state, action: PayloadAction<string[]>) => {
      state.segments = action.payload;
    },
  },
});

export const {
  setLoading,
  setStarted,
  setFinished,
  setSegments,
  setPlatformsLoading,
} = statesSlice.actions;
export default statesSlice.reducer;
