import { IGDBGameMinimal } from "../types/igdb";

export const emptyGames: IGDBGameMinimal[] = Array(16)
  .fill("")
  .map(() => ({
    name: "",
    _id: -1,
    aggregated_rating: 0,
    artworks: [],
    category: 0,
    cover: { _id: -1, height: 0, url: "", width: 0 },
    first_release_date: 0,
    game_modes: [],
    genres: [],
    involved_companies: [],
    keywords: [],
    platforms: [],
    release_dates: [],
    screenshots: [],
    slug: "",
    storyline: "",
    summary: "",
    themes: [],
    total_rating: 0,
    url: "",
    websites: [],
  }));
