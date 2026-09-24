import { IRelatedGameKey } from "@mooncellar/schemas";

export const RELATION_LABELS: Record<IRelatedGameKey, string> = {
  parent_game: "Main game",
  prequels: "Prequel",
  sequels: "Sequel",
  side_stories: "Side story",
  parent_stories: "Parent story",
  dlcs: "DLC",
  expansions: "Expansion",
  standalone_expansions: "Standalone expansion",
  remakes: "Remake",
  remasters: "Remaster",
  ports: "Port",
  forks: "Fork",
  alternative_versions: "Alternative version",
  expanded_games: "Expanded game",
  bundles: "Bundle",
  same_series: "Same series",
  same_setting: "Same setting",
  shared_characters: "Shared characters",
  similar_games: "Similar",
};
