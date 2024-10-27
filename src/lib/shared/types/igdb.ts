export interface IGDBDefault {
  _id: string;
  id: number;
  slug: string;
  name: string;
}

export interface IGDBPlatform extends IGDBDefault {
  platform_family: number;
  platform_logo: number;
}

export type IGDBFamily = IGDBDefault;

export interface IGDBGame extends IGDBDefault {
  cover: IGDBCover;
  screenshots: IGDBScreenshot[];
  total_rating: number;
  aggregated_rating: number;
  artworks: IGDBScreenshot[];
  game_modes: IGDBDefault[];
  genres: IGDBGenre[];
  platforms: IGDBPlatform[];
  keywords: IGDBDefault[];
  themes: IGDBDefault[];
  summary: string;
  storyline: string;
}

export interface IGDBGenre extends IGDBDefault {
  url: string;
}

export interface IGDBCover {
  _id: string;
  id: number;
  url: string;
  width: number;
  height: number;
}

export interface IGDBScreenshot {
  _id: string;
  id: number;
  url: string;
  width: number;
  height: number;
}
