import { combineReducers } from "@reduxjs/toolkit";
import commonSlice from "./commonSlice";
import statesSlice from "./statesSlice";
import authSlice from "./authSlice";
import selectedSlice from "./selectedSlice";
import excludedSlice from "./excludedSlice";

const appReducer = combineReducers({
  common: commonSlice,
  states: statesSlice,
  auth: authSlice,
  selected: selectedSlice,
  excluded: excludedSlice,
});

export default appReducer;
