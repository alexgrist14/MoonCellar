import { store } from "@/src/lib/app/store";
import { IGDBAgent } from "../../api";
import { IGDBDefault } from "../../types/igdb";
import { setGameModes } from "@/src/lib/app/store/slices/commonSlice";

export const getModes = () => {
  IGDBAgent<IGDBDefault[]>("https://api.igdb.com/v4/game_modes", {
    limit: 500,
    fields: "name, slug",
  }).then((response) => store.dispatch(setGameModes(response.data)));
};
