import {
  IGDBDefault,
  IGDBGenre,
  IGDBPlatform,
} from "@/src/lib/shared/types/igdb";
import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

const initialState: {
  excludedGenres: IGDBGenre[];
  excludedGameModes: IGDBDefault[];
  excludedSystems: IGDBPlatform[];
} = {
  excludedGenres: [],
  excludedGameModes: [],
  excludedSystems: [],
};

export const excludedSlice = createSlice({
  name: "excluded",
  initialState,
  reducers: {
    setExcludedGenres: (state, action: PayloadAction<IGDBGenre[]>) => {
      state.excludedGenres = action.payload;
    },
    setExcludedGameModes: (state, action: PayloadAction<IGDBDefault[]>) => {
      state.excludedGameModes = action.payload;
    },
    setExcludedSystems: (state, action: PayloadAction<IGDBPlatform[]>) => {
      state.excludedSystems = action.payload;
    },
  },
});

export const { setExcludedGenres, setExcludedGameModes, setExcludedSystems } =
  excludedSlice.actions;
export default excludedSlice.reducer;
