import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { IGDBDefault, IIGDBGenre, IIGDBPlatform } from "../interfaces";

const initialState: {
  excludedGenres: IIGDBGenre[];
  excludedGameModes: IGDBDefault[];
  excludedSystems: IIGDBPlatform[];
} = {
  excludedGenres: [],
  excludedGameModes: [],
  excludedSystems: [],
};

export const excludedSlice = createSlice({
  name: "excluded",
  initialState,
  reducers: {
    setExcludedGenres: (state, action: PayloadAction<IIGDBGenre[]>) => {
      state.excludedGenres = action.payload;
    },
    setExcludedGameModes: (state, action: PayloadAction<IGDBDefault[]>) => {
      state.excludedGameModes = action.payload;
    },
    setExcludedSystems: (state, action: PayloadAction<IIGDBPlatform[]>) => {
      state.excludedSystems = action.payload;
    },
  },
});

export const { setExcludedGenres, setExcludedGameModes, setExcludedSystems } =
  excludedSlice.actions;
export default excludedSlice.reducer;
