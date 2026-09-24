import { useMemo, useState } from "react";
import { useDebounce } from "use-debounce";
import { IContentRequestKind } from "@mooncellar/schemas";
import { useGamesQuery } from "@/src/lib/entities/game/api/game.queries";
import { useCharacterSearchQuery } from "@/src/lib/entities/character/api";
import { ISearchPickerOption } from "@/src/lib/shared/ui/SearchPicker";

const TAKE = 8;

export const useEntitySearch = (kind: IContentRequestKind) => {
  const [search, setSearch] = useState("");
  const [debounced] = useDebounce(search.trim(), 300);
  const isEnabled = debounced.length >= 2;

  const games = useGamesQuery(
    { search: debounced, take: TAKE },
    kind === "game" && isEnabled
  );
  const characters = useCharacterSearchQuery(
    kind === "character" ? debounced : "",
    TAKE
  );

  const options = useMemo<ISearchPickerOption[]>(() => {
    if (!isEnabled) return [];

    if (kind === "game") {
      return (games.data?.results ?? []).map((game) => ({
        id: game._id,
        label: game.name,
        meta: game.first_release
          ? String(new Date(game.first_release * 1000).getFullYear())
          : undefined,
        image: game.cover,
        slug: game.slug,
      }));
    }

    return (characters.data ?? []).map((character) => ({
      id: character._id,
      label: character.name,
      meta: character.akas?.slice(0, 2).join(", "),
      image: character.mugShot,
    }));
  }, [kind, isEnabled, games.data, characters.data]);

  return {
    search,
    setSearch,
    options,
    isLoading:
      search.trim() !== debounced ||
      (kind === "game" ? games.isLoading : characters.isLoading),
  };
};
