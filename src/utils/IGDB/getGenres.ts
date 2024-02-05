import { Dispatch, SetStateAction } from "react";
import { IGDBAgent } from "../../api";
import { IIGDBGenre } from "../../interfaces";

export const getGenres = (
  setGenres: Dispatch<SetStateAction<IIGDBGenre[]>>
) => {
  IGDBAgent<IIGDBGenre[]>("https://api.igdb.com/v4/genres", {
    limit: 500,
    fields: "name, slug, url",
  }).then((response) => setGenres(response.data));
};
