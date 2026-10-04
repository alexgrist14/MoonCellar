import { useMemo, useState } from "react";
import { useDebounce } from "use-debounce";
import { useGamesQuery } from "@/src/lib/entities/game/api/game.queries";
import { ISearchPickerOption } from "@/src/lib/shared/ui/SearchPicker";

const TAKE = 8;
const MIN_LENGTH = 2;

export const useGameSearch = (isEnabled = true) => {
  const [search, setSearch] = useState("");
  const [debounced] = useDebounce(search.trim(), 300);
  const isActive = isEnabled && debounced.length >= MIN_LENGTH;

  const { data, isLoading } = useGamesQuery(
    { search: debounced, take: TAKE },
    isActive
  );

  const options = useMemo<ISearchPickerOption[]>(
    () =>
      isActive
        ? (data?.results ?? []).map((game) => ({
            id: game._id,
            label: game.name,
            meta: game.first_release
              ? String(new Date(game.first_release * 1000).getFullYear())
              : undefined,
            image: game.cover,
            slug: game.slug,
          }))
        : [],
    [isActive, data]
  );

  return {
    search,
    setSearch,
    options,
    isLoading: search.trim() !== debounced || isLoading,
  };
};
