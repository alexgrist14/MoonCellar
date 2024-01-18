import { createSlice } from "@reduxjs/toolkit";
import { IAuth } from "../interfaces/responses";
import type { PayloadAction } from "@reduxjs/toolkit";

const initialState: IAuth = {
  userName: "",
  webApiKey: "",
};

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAuth: (state, action: PayloadAction<IAuth>) => {
      state.userName = action.payload.userName;
      state.webApiKey = action.payload.webApiKey;
    },
  },
});

export const { setAuth } = authSlice.actions;
export default authSlice.reducer;
