import { configureStore } from "@reduxjs/toolkit";
import {TypedUseSelectorHook, useDispatch, useSelector} from "react-redux";

import authSlice from "./authSlice";

export const reducerSetup = {
  auth: authSlice,
};

export const store = configureStore({
  reducer: reducerSetup,
});


type RootState = ReturnType<typeof store.getState>;
type AppDispatch = typeof store.dispatch;


export const useAppDispatch = (): AppDispatch => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
