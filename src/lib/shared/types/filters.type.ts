import { IGetGamesRequest } from "../lib/schemas/games.schema";

export interface IGameFiltersQuery
  extends Omit<IGetGamesRequest, "selected" | "excluded"> {
  selectedGenres?: string[];
  selectedModes?: string[];
  selectedPlatforms?: string[];
  selectedThemes?: string[];
  selectedKeywords?: string[];
  selectedGameTypes?: string[];
  excludedGenres?: string[];
  excludedModes?: string[];
  excludedPlatforms?: string[];
  excludedThemes?: string[];
  excludedKeywords?: string[];
  excludedGameTypes?: string[];
}
