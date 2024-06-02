import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

const initialState: {
  token: string;
} = {
  token: ""
};

export const authSlice = createSlice({
  initialState,
  name: "auth",
  reducers: {
    setAuth: (state, action: PayloadAction<string>) => {
      state.token = action.payload;
    }
  }
});

export const { setAuth } = authSlice.actions;
export default authSlice.reducer;
