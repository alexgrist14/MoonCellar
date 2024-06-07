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
  cover: IGDBCover[];
  screenshots: number[];
  total_rating: number;
  artworks: number[];
  franchise: number;
  franchises: number[];
  game_modes: IGDBDefault[];
  genres: IGDBGenre[];
  platforms: IGDBPlatform[];
  tags: number[];
  themes: number[];
  url: string;
}

export interface IGDBGenre extends IGDBDefault {
  url: string;
}

export interface IGDBCover {
  url: string;
  id: number;
  _id: string;
}
