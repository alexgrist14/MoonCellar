import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

const initialState: {
  id: string;
  email: string;
  user: string;
  isAuth: boolean;
} = {
  id: "",
  email: "",
  user: "",
  isAuth: false,
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
    setAuth:(
      state, action: PayloadAction<{isAuth: boolean}>
    )=>{
      state.isAuth = action.payload.isAuth
    }
  },
});

export const { setUser,setAuth } = authSlice.actions;
export default authSlice.reducer;
