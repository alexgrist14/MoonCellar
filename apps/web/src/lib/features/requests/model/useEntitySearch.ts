import { useMemo } from "react";
import { useDebounce } from "use-debounce";
import { IContentRequestKind } from "@mooncellar/schemas";
import { useGameSearch } from "@/src/lib/entities/game/model";
import { useCharacterSearchQuery } from "@/src/lib/entities/character/api";
import { ISearchPickerOption } from "@/src/lib/shared/ui/SearchPicker";

const TAKE = 8;

export const useEntitySearch = (kind: IContentRequestKind) => {
  const games = useGameSearch(kind === "game");
  const [debounced] = useDebounce(games.search.trim(), 300);
  const characters = useCharacterSearchQuery(
    kind === "character" ? debounced : "",
    TAKE
  );

  const characterOptions = useMemo<ISearchPickerOption[]>(
    () =>
      debounced.length >= 2
        ? (characters.data ?? []).map((character) => ({
            id: character._id,
            label: character.name,
            meta: character.akas?.slice(0, 2).join(", "),
            image: character.mugShot,
          }))
        : [],
    [debounced, characters.data]
  );

  return kind === "game"
    ? games
    : {
        search: games.search,
        setSearch: games.setSearch,
        options: characterOptions,
        isLoading: games.search.trim() !== debounced || characters.isLoading,
      };
};
