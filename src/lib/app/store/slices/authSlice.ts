import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

const initialState: {
  token: string
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
    },
    setUser: (state, action: PayloadAction<{email: string,user: string}>) => {
      state.email = action.payload.email;
      state.user = action.payload.user;
    }
  }
});

export const { setAuth,setUser } = authSlice.actions;
export default authSlice.reducer;
