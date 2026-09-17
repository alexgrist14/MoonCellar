import { FC, useEffect, useMemo, useState } from "react";
import { useDebounce } from "use-debounce";
import {
  ICustomListsSort,
  ICustomListsUpdated,
  IGetCustomListsRequest,
} from "@mooncellar/schemas";
import {
  useGamesByIdsQuery,
  useGamesQuery,
} from "@/src/lib/entities/game/api/game.queries";
import { useAdvancedRouter } from "@/src/lib/shared/hooks/useAdvancedRouter";
import { useExpandStore } from "@/src/lib/shared/store/expand.store";
import { ButtonColor } from "@/src/lib/shared/ui/Button";
import { ButtonGroup } from "@/src/lib/shared/ui/Button/ButtonGroup";
import { Dropdown } from "@/src/lib/shared/ui/Dropdown";
import { Input } from "@/src/lib/shared/ui/Input";
import { RangeSelector } from "@/src/lib/shared/ui/RangeSelector";
import { SvgChevron, SvgClose } from "@/src/lib/shared/ui/svg";
import { ToggleSwitch } from "@/src/lib/shared/ui/ToggleSwitch";
import {
  getListsGameIds,
  parseListsQuery,
  pushListsQuery,
} from "@/src/lib/pages/ListsPage/lists-query.utils";
import styles from "./ListsFilters.module.scss";

const FILTERS_ID = "lists-filters";

export const LIST_SORT_OPTIONS: { value: ICustomListsSort; label: string }[] = [
  { value: "popular", label: "Popular" },
  { value: "updatedAt", label: "Recently updated" },
  { value: "createdAt", label: "Newest" },
  { value: "gamesCount", label: "Most games" },
  { value: "name", label: "Name" },
];

export const LIST_UPDATED_OPTIONS: {
  value?: ICustomListsUpdated;
  label: string;
}[] = [
  { label: "Any time" },
  { value: "week", label: "Past week" },
  { value: "month", label: "Past month" },
  { value: "year", label: "Past year" },
];

interface IGameOption {
  _id: string;
  name: string;
}

export const ListsFilters: FC = () => {
  const { query, queryString } = useAdvancedRouter();
  const { expanded, setExpanded } = useExpandStore();

  const [filters, setFilters] = useState<IGetCustomListsRequest>(() =>
    parseListsQuery(query)
  );
  const [gamesSearch, setGamesSearch] = useState("");
  const [debouncedGamesSearch] = useDebounce(gamesSearch.trim(), 400);
  const [pickedGames, setPickedGames] = useState<IGameOption[]>([]);
  const [resetKey, setResetKey] = useState(0);

  useEffect(() => {
    setFilters(parseListsQuery(new URLSearchParams(queryString)));
  }, [queryString]);

  const selectedIds = useMemo(
    () => getListsGameIds({ games: filters.games }),
    [filters.games]
  );

  const { data: selectedData } = useGamesByIdsQuery(selectedIds);
  const { data: searchData } = useGamesQuery(
    { search: debouncedGamesSearch, take: 20 },
    debouncedGamesSearch.length >= 2
  );

  const selectedGames = useMemo<IGameOption[]>(
    () =>
      selectedIds.map((id) => {
        const game =
          pickedGames.find((item) => item._id === id) ??
          selectedData?.find((item) => item._id === id);

        return { _id: id, name: game?.name ?? "Loading…" };
      }),
    [selectedIds, pickedGames, selectedData]
  );

  const gameOptions = useMemo<IGameOption[]>(
    () => [
      ...selectedGames,
      ...(searchData?.results ?? [])
        .filter((game) => !selectedIds.includes(game._id))
        .map((game) => ({ _id: game._id, name: game.name })),
    ],
    [selectedGames, searchData, selectedIds]
  );

  const selectedIndexes = useMemo(
    () => selectedGames.map((_, index) => index),
    [selectedGames]
  );

  const setGames = (games: IGameOption[]) => {
    setPickedGames((current) => [
      ...current.filter((item) => !games.some((game) => game._id === item._id)),
      ...games,
    ]);
    setFilters((current) => ({
      ...current,
      games: games.map((game) => game._id),
    }));
  };

  const apply = () => {
    pushListsQuery({ ...filters, page: 1 });
    setExpanded(expanded?.filter((position) => position !== "left") || []);
  };

  const sortLabel =
    LIST_SORT_OPTIONS.find(
      (option) => option.value === (filters.sortBy ?? "popular")
    )?.label ?? "";
  const updatedLabel =
    LIST_UPDATED_OPTIONS.find((option) => option.value === filters.updated)
      ?.label ?? "";
  const minGames = Number(filters.minGames) || 1;

  return (
    <div className={styles.filters} id={FILTERS_ID}>
      <div className={styles.filters__wrapper}>
        <h4>Sort by</h4>
        <div className={styles.filters__sort}>
          <Dropdown
            isThroughPortal
            overflowRootId={FILTERS_ID}
            list={LIST_SORT_OPTIONS.map((option) => option.label)}
            overwriteValue={sortLabel}
            placeholder="Popular"
            getIndex={(index) =>
              setFilters((current) => ({
                ...current,
                sortBy: LIST_SORT_OPTIONS[index]?.value ?? "popular",
              }))
            }
          />
          <ToggleSwitch
            isColorless
            leftContent={<SvgChevron style={{ transform: "rotate(180deg)" }} />}
            rightContent={<SvgChevron />}
            value={filters.sortOrder === "asc" ? "left" : "right"}
            clickCallback={() =>
              setFilters((current) => ({
                ...current,
                sortOrder: current.sortOrder === "asc" ? "desc" : "asc",
              }))
            }
          />
        </div>
      </div>
      <div className={styles.filters__wrapper}>
        <h4>List name</h4>
        <Input
          containerStyles={{ width: "100%" }}
          placeholder="Enter name of the list..."
          value={filters.search ?? ""}
          onKeyDown={(e) => e.key === "Enter" && apply()}
          onChange={(e) =>
            setFilters((current) => ({ ...current, search: e.target.value }))
          }
        />
      </div>
      <div className={styles.filters__wrapper}>
        <h4>Author</h4>
        <Input
          containerStyles={{ width: "100%" }}
          placeholder="Enter user name..."
          value={filters.author ?? ""}
          onKeyDown={(e) => e.key === "Enter" && apply()}
          onChange={(e) =>
            setFilters((current) => ({ ...current, author: e.target.value }))
          }
        />
      </div>
      <div className={styles.filters__wrapper}>
        <div className={styles.filters__header}>
          <h4>Contains games</h4>
          <ToggleSwitch
            isColorless
            leftContent="Any"
            rightContent="All"
            value={filters.gamesMode === "all" ? "right" : "left"}
            clickCallback={(result) =>
              setFilters((current) => ({
                ...current,
                gamesMode: result === "All" ? "all" : "any",
              }))
            }
          />
        </div>
        <Dropdown
          isMulti
          isWithReset
          isWithSearch
          isThroughPortal
          overflowRootId={FILTERS_ID}
          list={gameOptions.map((game) => game.name)}
          initialMultiValue={selectedIndexes}
          overwriteValue={
            selectedGames.length ? `${selectedGames.length} selected` : ""
          }
          placeholder="Select games..."
          getSearchQuery={setGamesSearch}
          getIndexes={(indexes) =>
            setGames(
              indexes
                .map((index) => gameOptions[index])
                .filter((game): game is IGameOption => !!game)
            )
          }
        />
        {!!selectedGames.length && (
          <div className={styles.filters__chips}>
            {selectedGames.map((game) => (
              <button
                key={game._id}
                type="button"
                className={styles.filters__chip}
                onClick={() =>
                  setGames(
                    selectedGames.filter((item) => item._id !== game._id)
                  )
                }
              >
                {game.name}
                <SvgClose size="12" />
              </button>
            ))}
          </div>
        )}
      </div>
      <div className={styles.filters__wrapper}>
        <h4>Last updated</h4>
        <Dropdown
          isThroughPortal
          overflowRootId={FILTERS_ID}
          list={LIST_UPDATED_OPTIONS.map((option) => option.label)}
          overwriteValue={updatedLabel}
          placeholder="Any time"
          getIndex={(index) =>
            setFilters((current) => ({
              ...current,
              updated: LIST_UPDATED_OPTIONS[index]?.value,
            }))
          }
        />
      </div>
      <div className={styles.filters__range}>
        <RangeSelector
          key={`${queryString}-${resetKey}`}
          text={minGames > 1 ? `From ${minGames} games` : "Any size"}
          defaultValue={minGames}
          min={1}
          max={100}
          callback={(value) =>
            setFilters((current) => ({
              ...current,
              minGames: value > 1 ? value : undefined,
            }))
          }
        />
      </div>
      <ButtonGroup
        wrapperClassName={styles.filters__buttons}
        wrapperStyle={{ width: "100%" }}
        buttons={[
          {
            title: "Filter lists",
            color: ButtonColor.ACCENT,
            onClick: apply,
          },
          {
            title: "Clear filters",
            color: ButtonColor.RED,
            onClick: () => {
              setPickedGames([]);
              setFilters({});
              setResetKey((key) => key + 1);
            },
          },
        ]}
      />
    </div>
  );
};
