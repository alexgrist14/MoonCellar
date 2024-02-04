import { combineReducers } from "@reduxjs/toolkit";
import commonSlice from "./commonSlice";
import statesSlice from "./statesSlice";

const appReducer = combineReducers({
  common: commonSlice,
  states: statesSlice,
});

export default appReducer;
