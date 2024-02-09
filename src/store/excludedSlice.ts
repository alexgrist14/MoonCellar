import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { IIGDBGenre } from "../interfaces";

const initialState: {
  excludedGenres: IIGDBGenre[];
} = {
  excludedGenres: [],
};

export const excludedSlice = createSlice({
  name: "excluded",
  initialState,
  reducers: {
    setExcludedGenres: (state, action: PayloadAction<IIGDBGenre[]>) => {
      state.excludedGenres = action.payload;
    },
  },
});

export const { setExcludedGenres } = excludedSlice.actions;
export default excludedSlice.reducer;
