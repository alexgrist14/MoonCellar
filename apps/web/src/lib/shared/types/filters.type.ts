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
  selectedCompanies?: string[];
  selectedGameEngines?: string[];
  selectedPlayerPerspectives?: string[];
  selectedLanguages?: string[];
  selectedStatus?: string[];
  selectedAgeRatings?: string[];
  excludedGenres?: string[];
  excludedModes?: string[];
  excludedPlatforms?: string[];
  excludedThemes?: string[];
  excludedKeywords?: string[];
  excludedGameTypes?: string[];
  excludedFranchises?: string[];
  excludedCompanies?: string[];
  excludedGameEngines?: string[];
  excludedPlayerPerspectives?: string[];
  excludedLanguages?: string[];
  excludedStatus?: string[];
  excludedAgeRatings?: string[];
  modeGenres?: IFilterModeValue;
  modeModes?: IFilterModeValue;
  modePlatforms?: IFilterModeValue;
  modeThemes?: IFilterModeValue;
  modeKeywords?: IFilterModeValue;
  modeGameTypes?: IFilterModeValue;
  modeFranchises?: IFilterModeValue;
  modeCompanies?: IFilterModeValue;
  modeGameEngines?: IFilterModeValue;
  modePlayerPerspectives?: IFilterModeValue;
  modeLanguages?: IFilterModeValue;
  modeStatus?: IFilterModeValue;
  modeAgeRatings?: IFilterModeValue;
}
