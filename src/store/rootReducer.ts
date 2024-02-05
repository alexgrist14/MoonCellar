import { combineReducers } from "@reduxjs/toolkit";
import commonSlice from "./commonSlice";
import statesSlice from "./statesSlice";
import authSlice from "./authSlice";

const appReducer = combineReducers({
  common: commonSlice,
  states: statesSlice,
  auth: authSlice,
});

export default appReducer;
