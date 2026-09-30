import {
  FAN_DISC_GAME_TYPE,
  FAN_DISC_GAME_TYPES,
  INCOMPATIBLE_GENRES,
  MAIN_GAME_TYPE,
  MIN_DESCRIPTION_TOKENS,
  MIN_SHARED_DESCRIPTION_TOKENS,
  REEDITION_TYPES,
  VISUAL_NOVEL_GENRE,
  VNDB_ANY_COMPANY_SCORE,
  VNDB_COMPANY_MISMATCH_SCORE,
  VNDB_DATE_CONFIRMS_SCORE,
  VNDB_DATE_CONTRADICTS_SCORE,
  VNDB_DATE_MAX_DIFF_DAYS,
  VNDB_DESCRIPTION_SIMILARITY,
  VNDB_DISTINCTIVE_TITLE_SCORE,
  VNDB_FUZZY_TITLE_SIMILARITY,
  VNDB_GENRE_SCORE,
  VNDB_INCOMPATIBLE_GENRE_SCORE,
  VNDB_PLATFORM_MATCH_SCORE,
  VNDB_PLATFORM_MISMATCH_SCORE,
  VNDB_ROLE_COMPANY_SCORE,
  VNDB_SCORE_GAP,
  VNDB_SCORE_THRESHOLD,
  VNDB_STRONG_TITLE_SCORE,
  VNDB_WEAK_TITLE_SCORE,
} from "../constants/vndb";
import type { IMatchProfile } from "./game-matcher.types";

export const VNDB_MATCH_PROFILE: IMatchProfile = {
  threshold: VNDB_SCORE_THRESHOLD,
  gap: VNDB_SCORE_GAP,
  title: {
    distinctive: VNDB_DISTINCTIVE_TITLE_SCORE,
    strong: VNDB_STRONG_TITLE_SCORE,
    weak: VNDB_WEAK_TITLE_SCORE,
    fuzzySimilarity: VNDB_FUZZY_TITLE_SIMILARITY,
  },
  company: {
    role: VNDB_ROLE_COMPANY_SCORE,
    any: VNDB_ANY_COMPANY_SCORE,
    mismatch: VNDB_COMPANY_MISMATCH_SCORE,
  },
  date: {
    confirms: VNDB_DATE_CONFIRMS_SCORE,
    contradicts: VNDB_DATE_CONTRADICTS_SCORE,
    maxDiffDays: VNDB_DATE_MAX_DIFF_DAYS,
  },
  genre: {
    expected: VISUAL_NOVEL_GENRE,
    score: VNDB_GENRE_SCORE,
    incompatible: INCOMPATIBLE_GENRES,
    incompatibleScore: VNDB_INCOMPATIBLE_GENRE_SCORE,
  },
  platform: {
    match: VNDB_PLATFORM_MATCH_SCORE,
    mismatch: VNDB_PLATFORM_MISMATCH_SCORE,
  },
  description: {
    minTokens: MIN_DESCRIPTION_TOKENS,
    minShared: MIN_SHARED_DESCRIPTION_TOKENS,
    similarity: VNDB_DESCRIPTION_SIMILARITY,
  },
  typeScore: (subjectType, gameType) => {
    if (REEDITION_TYPES.includes(gameType)) return -1;

    if (subjectType === FAN_DISC_GAME_TYPE) {
      return FAN_DISC_GAME_TYPES.includes(gameType) ? 1 : 0;
    }

    return gameType === MAIN_GAME_TYPE ? 1 : 0;
  },
  reviewCustomGames: false,
};

export const IGDB_MATCH_PROFILE: IMatchProfile = {
  ...VNDB_MATCH_PROFILE,
  genre: null,
  typeScore: (subjectType, gameType) => {
    if (!subjectType || !gameType) return 0;
    if (subjectType === gameType) return 1;

    return REEDITION_TYPES.includes(subjectType) !==
      REEDITION_TYPES.includes(gameType)
      ? -1
      : 0;
  },
  reviewCustomGames: true,
};
