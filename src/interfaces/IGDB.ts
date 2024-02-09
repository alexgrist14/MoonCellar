export interface IGDBDefault {
  id: number;
  slug: string;
  name: string;
}

export interface IIGDBPlatform extends IGDBDefault {
  platform_family: number;
  platform_logo: number;
}

export type IIGDBPlatformFamily = IGDBDefault;

export interface IIGDBGame extends IGDBDefault {
  cover: number;
  screenshots: number[];
  total_rating: number;
  artworks: number[];
  franchise: number;
  franchises: number[];
  game_modes: number[];
  genres: number[];
  platforms: number[];
  tags: number[];
  themes: number[];
  url: string;
}

export interface IIGDBGenre extends IGDBDefault {
  url: string;
}

export interface IIGDBCover {
  url: string;
  id: number;
}
