import { combineReducers } from "@reduxjs/toolkit";
import commonSlice from "./slices/commonSlice";
import statesSlice from "./slices/statesSlice";
import authSlice from "./slices/authSlice";
import selectedSlice from "./slices/selectedSlice";
import excludedSlice from "./slices/excludedSlice";

const appReducer = combineReducers({
  common: commonSlice,
  states: statesSlice,
  auth: authSlice,
  selected: selectedSlice,
  excluded: excludedSlice,
});

export default appReducer;
