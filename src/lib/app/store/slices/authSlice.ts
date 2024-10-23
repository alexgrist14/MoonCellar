import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

const initialState: {
  id: string;
  email: string;
  user: string;
} = {
  id: "",
  email: "",
  user: "",
};

export const authSlice = createSlice({
  initialState,
  name: "auth",
  reducers: {
    setUser: (
      state,
      action: PayloadAction<{ id: string ; email: string; user: string;}>
    ) => {
      state.id = action.payload.id;
      state.email = action.payload.email;
      state.user = action.payload.user;
    },
  },
});

export const { setUser } = authSlice.actions;
export default authSlice.reducer;
