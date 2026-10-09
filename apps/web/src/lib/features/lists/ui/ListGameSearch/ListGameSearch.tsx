import {
  FC,
  KeyboardEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import classNames from "classnames";
import { useDebounce } from "use-debounce";
import {
  CUSTOM_LIST_GAMES_MAX,
  ICustomListDetails,
  IGameResponse,
} from "@mooncellar/schemas";
import { useAddListGameMutation } from "@/src/lib/entities/list/api";
import { useGamesQuery } from "@/src/lib/entities/game/api/game.queries";
import { useCommonStore } from "@/src/lib/shared/store/common.store";
import { Button, ButtonColor } from "@/src/lib/shared/ui/Button";
import { Cover } from "@/src/lib/shared/ui/Cover";
import { EmptyState } from "@/src/lib/shared/ui/EmptyState";
import { Input } from "@/src/lib/shared/ui/Input";
import { Skeleton } from "@/src/lib/shared/ui/Skeleton";
import { Popover } from "@/src/lib/shared/ui/Popover";
import { SvgCheck, SvgSearch } from "@/src/lib/shared/ui/svg";
import { toast } from "@/src/lib/shared/utils/toast.utils";
import styles from "./ListGameSearch.module.scss";

const MIN_SEARCH_LENGTH = 2;
const RESULTS_TAKE = 8;

interface IListGameSearchProps {
  list: ICustomListDetails;
  autoFocus?: boolean;
  onAdded?: (game: IGameResponse) => void;
}

export const ListGameSearch: FC<IListGameSearchProps> = ({
  list,
  autoFocus,
  onAdded,
}) => {
  const fieldRef = useRef<HTMLDivElement>(null);
  const listboxRef = useRef<HTMLDivElement>(null);

  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const normalizedSearch = search.trim();
  const [debouncedSearch] = useDebounce(normalizedSearch, 300);
  const isSearchActive = normalizedSearch.length >= MIN_SEARCH_LENGTH;

  const systems = useCommonStore((s) => s.systems);
  const {
    mutate: addGame,
    isPending: isAdding,
    variables,
  } = useAddListGameMutation();

  const { data, isLoading } = useGamesQuery(
    { search: debouncedSearch, take: RESULTS_TAKE },
    debouncedSearch.length >= MIN_SEARCH_LENGTH
  );

  const games = useMemo(
    () => (isSearchActive ? (data?.results ?? []) : []),
    [data, isSearchActive]
  );
  const addedIds = useMemo(
    () => new Set(list.games.map((game) => game.gameId)),
    [list.games]
  );
  const isFull = list.gamesCount >= CUSTOM_LIST_GAMES_MAX;
  const isSearching = normalizedSearch !== debouncedSearch || isLoading;

  const close = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    setActiveIndex(0);
  }, [debouncedSearch]);

  useEffect(() => {
    listboxRef.current
      ?.querySelector('[aria-selected="true"]')
      ?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  const handleAdd = (game: IGameResponse) => {
    if (addedIds.has(game._id) || isFull || isAdding) return;

    addGame(
      { id: list._id, dto: { gameId: game._id, position: "end" } },
      {
        onSuccess: () => {
          toast.success({ description: `Added ${game.name} to ${list.name}` });
          onAdded?.(game);
        },
      }
    );
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!games.length) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setIsOpen(true);
      setActiveIndex((index) => (index + 1) % games.length);
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => (index - 1 + games.length) % games.length);
    }

    if (event.key === "Enter") {
      event.preventDefault();
      games[activeIndex] && handleAdd(games[activeIndex]);
    }
  };

  const getMeta = (game: IGameResponse) =>
    [
      game.first_release
        ? new Date(game.first_release * 1000).getFullYear()
        : undefined,
      systems
        ?.filter((system) => game.platformIds?.includes(system._id))
        .map((system) => system.name)
        .join(", "),
    ]
      .filter(Boolean)
      .join(" · ");

  const dropdown = (
    <Popover
      anchorRef={fieldRef}
      isOpen={isOpen && isSearchActive}
      onClose={close}
      matchAnchorWidth
      isSheetDisabled
      contentStyle={{ padding: 0 }}
    >
      <div ref={listboxRef} className={styles.dropdown} role="listbox">
        {isFull && (
          <p className={styles.dropdown__note}>
            This list is full — {CUSTOM_LIST_GAMES_MAX} of{" "}
            {CUSTOM_LIST_GAMES_MAX} games.
          </p>
        )}
        {isSearching && !games.length && (
          <div role="status" aria-label="Loading">
            {Array.from({ length: 3 }, (_, index) => (
              <div key={index} className={styles.result}>
                <Skeleton
                  aspectRatio="var(--cover-ratio)"
                  radius="var(--radius-x1)"
                />
                <Skeleton shape="text" count={2} gap="var(--gap-x1)" />
              </div>
            ))}
          </div>
        )}
        {!isSearching && !games.length && (
          <EmptyState
            variant="compact"
            isWithoutImage
            title={`Nothing found for “${normalizedSearch}”`}
            description="Check the spelling or try the original title."
          />
        )}
        {games.map((game, index) => {
          const isAdded = addedIds.has(game._id);
          const isPendingGame = isAdding && variables?.dto.gameId === game._id;

          return (
            <div
              key={game._id}
              role="option"
              aria-selected={index === activeIndex}
              className={classNames(styles.result, {
                [styles.result_active]: index === activeIndex,
              })}
              onMouseEnter={() => setActiveIndex(index)}
            >
              <span className={styles.result__cover}>
                {game.cover ? (
                  <Image
                    src={game.cover}
                    alt=""
                    fill
                    sizes="32px"
                    className={styles.result__image}
                  />
                ) : (
                  <Cover isWithoutText className={styles.result__image} />
                )}
              </span>
              <span className={styles.result__body}>
                <span className={styles.result__name}>{game.name}</span>
                <span className={styles.result__meta}>{getMeta(game)}</span>
              </span>
              {isAdded ? (
                <span className={styles.result__added}>
                  <SvgCheck size="16" style={{ color: "inherit" }} />
                  Added
                </span>
              ) : (
                <Button
                  type="button"
                  color={ButtonColor.ACCENT}
                  compact
                  disabled={isFull || isAdding}
                  onClick={() => handleAdd(game)}
                >
                  {isPendingGame ? "Adding…" : "Add"}
                </Button>
              )}
            </div>
          );
        })}
        {!!games.length && (
          <p className={styles.dropdown__hint}>
            ↑ ↓ to move · Enter adds · Esc closes
          </p>
        )}
      </div>
    </Popover>
  );

  return (
    <div
      ref={fieldRef}
      className={styles.search}
      onClick={() => setIsOpen(true)}
    >
      <Input
        icon={<SvgSearch size="20" style={{ color: "inherit" }} />}
        value={search}
        autoFocus={autoFocus}
        placeholder={
          list.gamesCount
            ? "Search for a game to add…"
            : "Search for a game to add the first one…"
        }
        aria-label="Search for a game to add"
        autoComplete="off"
        onChange={(event) => {
          setSearch(event.target.value);
          setIsOpen(true);
        }}
        onKeyDown={handleKeyDown}
      />
      {dropdown}
    </div>
  );
};
