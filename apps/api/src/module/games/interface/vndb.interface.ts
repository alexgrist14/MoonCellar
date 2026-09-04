import mongoose from "mongoose";
import { Game } from "../schemas/game.schema";

export type TFieldStatus = 0 | 1 | 2;

export type TVndbFilterValue = string | number | TVndbFilter | TVndbFilters;
export type TVndbFilter = [
  field: string,
  operator: "=" | "!=",
  value: TVndbFilterValue,
];
export type TVndbFilters = ["or" | "and", ...TVndbFilter[]];
export type TVndbCandidate = Pick<
  Game,
  | "name"
  | "slug"
  | "nameNormalized"
  | "type"
  | "genres"
  | "first_release"
  | "release_dates"
  | "alternative_names"
  | "companies"
  | "platformIds"
  | "summary"
> & { _id: mongoose.Types.ObjectId };

export type TDateSignal = "confirms" | "contradicts" | "unknown";
export type TDescriptionSignal = "match" | "mismatch" | "unknown";

export type TMatchReason =
  | "below-threshold"
  | "competing-candidates"
  | "weak-title"
  | "date-contradicts"
  | "description-mismatch"
  | "no-company-evidence"
  | "company-mismatch"
  | "unverified-title";
export type TMatchVerdict = "matched" | "ambiguous" | "absent";

export interface IScoreBreakdown {
  date: number;
  genre: number;
  type: number;
  title: number;
  companies: number;
  platforms: number;
}

export interface IScoredCandidate {
  game: TVndbCandidate;
  score: number;
  dateSignal: TDateSignal;
  breakdown: IScoreBreakdown;
  isDistinctiveTitle: boolean;
  isMainTitleMatch: boolean;
  isCorroborated: boolean;
  isContradicted: boolean;
  hasCompanyMismatch: boolean;
  descriptionSignal: TDescriptionSignal;
}

export interface IScoreContext {
  platformSlugById: Map<string, string>;
  sharedTitles: Set<string>;
}

export interface IVnMatch {
  vnId: string;
  vnName: string;
  verdict: TMatchVerdict;
  reason: TMatchReason | null;
  winner: TVndbCandidate | null;
  candidates: IScoredCandidate[];
}

export type TCandidatesByVn = Map<string, TVndbCandidate[]>;

export interface IVnReleaseSignals {
  publishers: string[];
  releaseDates: string[];
  platforms: string[];
}

export type TReleaseSignalsByVn = Map<string, IVnReleaseSignals>;

export type TStaffRole =
  | "Scenario"
  | "Director"
  | "Character design"
  | "Artist"
  | "Composer"
  | "Vocals"
  | "Translator"
  | "Editor"
  | "Quality assurance"
  | "Staff";

export interface IVndbImage {
  id: string;
  url: string;
  dims: [number, number];
  //Number between 0 and 2 (inclusive), average image flagging vote for sexual content.
  sexual: TFieldStatus;
  //Number between 0 and 2 (inclusive), average image flagging vote for violence.
  violence: TFieldStatus;
  votecount: number;
  thumbnail: string;
  thumbnail_dims: [number, number];
}

export interface IVndbTag {
  id: string;
  name: string;
  aliases: string[];
  description: string;
  //"cont" for content, "ero" for sexual content and "tech" for technical tags.
  category: "cont" | "ero" | "tech";
  searchable: boolean;
  applicable: boolean;
  vn_count: number;
}

export interface IVndbProducer {
  id: string;
  name: string;
  original: string | null;
  aliases: string[];
  lang: string;
  //producer type, "co" for company, "in" for individual and "ng" for amateur group.
  type: "co" | "in" | "ng";
  description: string | null;
  extlinks: IVndbExtlink[] | null;
}

export interface IVndbExtlink {
  url: string;
  label: string;
  name: string;
  id: string;
}

export interface IVndbStaff {
  id: string;
  aid: number;
  ismain: boolean;
  name: string;
  original: string | null;
  lang: string;
  gender: "m" | "f" | null;
  description: string | null;
  extlinks: IVndbExtlink[] | null;
  aliases: {
    aid: number;
    name: string;
    latin: string | null;
    ismain: boolean;
  }[];
}

export interface IVndbTitle {
  lang: string;
  latin: string | null;
  title: string;
  official: boolean;
  main: boolean;
}

export interface IVndbNovel {
  id: string;
  title: string;
  alttitle: string;
  titles: IVndbTitle[];
  aliases: string[];
  olang: string;
  //0 meaning ‘Finished’, 1 is ‘In development’ and 2 for ‘Cancelled’.
  devstatus: TFieldStatus;
  released: string | null;
  languages: string[];
  platforms: string[];
  image: IVndbImage | null;
  //rough length estimate of the VN between 1 (very short) and 5 (very long).
  // This field is only used as a fallback for when there are no length votes,
  // so you’ll probably want to fetch length_minutes too.
  length: 0 | 1 | 2 | 3 | 4 | 5;
  length_minutes: number | null;
  length_votes: number;
  description: string | null;
  average: number | null;
  rating: number | null;
  votecount: number;
  screenshots: IVndbImage[] | null;
  relations: { relation: string; relation_official: boolean }[];
  tags:
    | ({
        rating: 0 | 1 | 2 | 3;
        spoiler: 0 | 1 | 2;
        lie: boolean;
      } & IVndbTag)[]
    | null;
  developers: IVndbProducer[] | null;
  editions:
    | { eid: number; lang: string | null; name: string; official: boolean }[]
    | null;
  staff:
    | (IVndbStaff & { eid: number; role: TStaffRole; note: string | null })[]
    | null;
  //Each object represents a voice actor relation. The same voice actor may be listed multiple times for different
  // characters and the same character may be listed multiple times if it has been voiced by several people.
  va:
    | {
        note: string | null;
        staff: IVndbStaff;
      }[]
    | null;

  extlinks: IVndbExtlink[] | null;
}

export interface IVndbGameResponse {
  more: boolean;
  results: IVndbNovel[];
}

export interface IVndbReleaseProducer extends IVndbProducer {
  developer: boolean;
  publisher: boolean;
}

export interface IVndbRelease {
  id: string;
  official: boolean;
  released: string | null;
  platforms: string[] | null;
  vns: { id: string }[] | null;
  producers: IVndbReleaseProducer[] | null;
}

export interface IVndbReleaseResponse {
  more: boolean;
  results: IVndbRelease[];
}
