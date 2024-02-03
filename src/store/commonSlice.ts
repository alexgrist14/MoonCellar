import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

const initialState: { isLoading: boolean; apiType: "RA" | "IGDB" } = {
  isLoading: false,
  apiType: "RA",
};

export const commonSlice = createSlice({
  name: "common",
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setApiType: (state, action: PayloadAction<"RA" | "IGDB">) => {
      state.apiType = action.payload;
    },
  },
});

export const { setLoading, setApiType } = commonSlice.actions;
export default commonSlice.reducer;
