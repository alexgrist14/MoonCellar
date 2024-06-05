import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

const initialState: {
  token: string;
  email: string;
  user: string;
} = {
  token: "",
  email: "",
  user: ""
};

export const authSlice = createSlice({
  initialState,
  name: "auth",
  reducers: {
    setAuth: (state, action: PayloadAction<string>) => {
      state.token = action.payload;
      state.email = action.payload;
      state.user = action.payload;
    }
  }
});

export const { setAuth } = authSlice.actions;
export default authSlice.reducer;
