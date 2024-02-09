import { IGDBAgent } from "../../api";
import { IGDBDefault } from "../../interfaces";
import { store } from "../../store";
import { setGameModes } from "../../store/commonSlice";

export const getModes = () => {
  IGDBAgent<IGDBDefault[]>("https://api.igdb.com/v4/game_modes", {
    limit: 500,
    fields: "name, slug",
  }).then((response) => store.dispatch(setGameModes(response.data)));
};
