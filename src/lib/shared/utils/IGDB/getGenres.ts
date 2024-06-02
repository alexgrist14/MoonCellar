import { store } from "@/src/lib/app/store";
import { IGDBAgent } from "../../api";
import { IIGDBGenre } from "../../types/igdb";
import { setGenres } from "@/src/lib/app/store/slices/commonSlice";

export const getGenres = () => {
  IGDBAgent<IIGDBGenre[]>("https://api.igdb.com/v4/genres", {
    limit: 500,
    fields: "name, slug, url",
  }).then((response) => store.dispatch(setGenres(response.data)));
};
