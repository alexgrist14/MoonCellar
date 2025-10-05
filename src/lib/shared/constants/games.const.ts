import { IGameResponse } from "../lib/schemas/games.schema";

export const emptyGames: IGameResponse[] = Array(16)
  .fill("")
  .map(() => ({
    name: "",
    _id: "-1",
    artworks: [],
    type: "",
    cover: "",
    first_release: 0,
    modes: [],
    genres: [],
    companies: [],
    keywords: [],
    platforms: [],
    release_dates: [],
    screenshots: [],
    slug: "",
    storyline: "",
    summary: "",
    themes: [],
    websites: [],
    createdAt: "",
    updatedAt: "",
    platformIds: [],
    igdbId: 0,
    retroachievements: [],
  }));

export const takeGames = 120;
