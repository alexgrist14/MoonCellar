import { IGetGamesRequest } from "../lib/schemas/games.schema";

type IFilterModeValue = "any" | "all";

export interface IGameFiltersQuery extends Omit<
  IGetGamesRequest,
  "selected" | "excluded" | "mode"
> {
  selectedGenres?: string[];
  selectedModes?: string[];
  selectedPlatforms?: string[];
  selectedThemes?: string[];
  selectedKeywords?: string[];
  selectedGameTypes?: string[];
  selectedFranchises?: string[];
  excludedGenres?: string[];
  excludedModes?: string[];
  excludedPlatforms?: string[];
  excludedThemes?: string[];
  excludedKeywords?: string[];
  excludedGameTypes?: string[];
  excludedFranchises?: string[];
  modeGenres?: IFilterModeValue;
  modeModes?: IFilterModeValue;
  modePlatforms?: IFilterModeValue;
  modeThemes?: IFilterModeValue;
  modeKeywords?: IFilterModeValue;
  modeGameTypes?: IFilterModeValue;
  modeFranchises?: IFilterModeValue;
}
