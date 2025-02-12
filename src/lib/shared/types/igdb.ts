import { IRAGame } from "./retroachievements";

export interface IGDBDefault {
  _id: number;
  slug: string;
  name: string;
}

export interface IGDBPlatform extends IGDBDefault {
  platform_family: IGDBDefault;
  platform_logo: IGDBScreenshot;
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
  first_release_date: number;
  category: number;
  websites: IGDBWebsite[];
  involved_companies: IGDBInvolvedCompany[];
  url: string;
  release_dates: IGDBReleaseDate[];
  raIds?: IRAGame[];
}

export interface IGDBGameMinimal
  extends Omit<
    IGDBGame,
    | "screenshots"
    | "artworks"
    | "game_modes"
    | "genres"
    | "keywords"
    | "themes"
    | "websites"
    | "involved_companies"
  > {
  screenshots: number[];
  artworks: number[];
  game_modes: number[];
  genres: number[];
  keywords: number[];
  themes: number[];
  websites: number[];
  involved_companies: number[];
}

export interface IGDBReleaseDate {
  _id: number;
  category: number;
  date: number;
  human: string;
  m: number;
  y: number;
  platform: IGDBPlatform;
  region: number;
}

export interface IGDBWebsite {
  _id: number;
  category: number;
  url: string;
}

export interface IGDBInvolvedCompany {
  _id: number;
  company: IGDBCompany;
  developer: boolean;
  porting: boolean;
  publisher: boolean;
  supporting: boolean;
}

export interface IGDBCompany {
  _id: number;
  logo: number;
  name: string;
  slug: string;
  description: string;
  country: number;
  developed: number[];
  published: number[];
  url: string;
  start_date: string;
}

export interface IGDBGenre extends IGDBDefault {
  url: string;
}

export interface IGDBCover {
  _id: number;
  url: string;
  width: number;
  height: number;
}

export interface IGDBScreenshot {
  _id: number;
  url: string;
  width: number;
  height: number;
}
