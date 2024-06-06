import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

const initialState: {
  email: string;
  user: string;
} = {
  email: "",
  user: ""
};

export const authSlice = createSlice({
  initialState,
  name: "auth",
  reducers: {
    setAuth: (state, action: PayloadAction<{email: string,user: string}>) => {
      state.email = action.payload;
      state.user = action.payload;
    }
  }
});

export const { setAuth } = authSlice.actions;
export default authSlice.reducer;
