import { store } from "../../app/store";

export const getRoyalGames = () => {
  const { apiType, royalGamesIGDB, royalGamesRA } = store.getState().selected;
  if (apiType === "RA") return royalGamesRA;
  if (apiType === "IGDB") return royalGamesIGDB;

  return [];
};
