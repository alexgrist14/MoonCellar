import {
  FC,
  KeyboardEvent,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
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
import { useCloseEvents } from "@/src/lib/shared/hooks/useCloseEvents";
import { useCommonStore } from "@/src/lib/shared/store/common.store";
import { Button, ButtonColor } from "@/src/lib/shared/ui/Button";
import { Cover } from "@/src/lib/shared/ui/Cover";
import { Input } from "@/src/lib/shared/ui/Input";
import { SvgCheck, SvgSearch } from "@/src/lib/shared/ui/svg";
import { toast } from "@/src/lib/shared/utils/toast.utils";
import styles from "./ListGameSearch.module.scss";

const MIN_SEARCH_LENGTH = 2;
const RESULTS_TAKE = 8;
const DROPDOWN_GAP = 8;

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
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [coords, setCoords] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);
  const [connector, setConnector] = useState<HTMLElement | null>(null);

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

  useCloseEvents([fieldRef, dropdownRef], close);

  useEffect(() => {
    setConnector(document.getElementById("dropdown-connector"));
  }, []);

  useEffect(() => {
    setActiveIndex(0);
  }, [debouncedSearch]);

  useLayoutEffect(() => {
    if (!isOpen || !isSearchActive) return;

    const update = () => {
      const rect = fieldRef.current?.getBoundingClientRect();

      if (!rect) return;

      setCoords({
        top: rect.bottom + DROPDOWN_GAP,
        left: rect.left,
        width: rect.width,
      });
    };

    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);

    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [isOpen, isSearchActive]);

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

  const dropdown =
    isOpen && isSearchActive && !!coords && !!connector
      ? createPortal(
          <div
            ref={dropdownRef}
            className={styles.dropdown}
            style={{ top: coords.top, left: coords.left, width: coords.width }}
            role="listbox"
          >
            {isFull && (
              <p className={styles.dropdown__note}>
                This list is full — {CUSTOM_LIST_GAMES_MAX} of{" "}
                {CUSTOM_LIST_GAMES_MAX} games.
              </p>
            )}
            {isSearching && !games.length && (
              <p className={styles.dropdown__note}>Searching…</p>
            )}
            {!isSearching && !games.length && (
              <p className={styles.dropdown__note}>
                Nothing found for “{normalizedSearch}”. Check the spelling or
                try the original title.
              </p>
            )}
            {games.map((game, index) => {
              const isAdded = addedIds.has(game._id);
              const isPendingGame =
                isAdding && variables?.dto.gameId === game._id;

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
          </div>,
          connector
        )
      : null;

  return (
    <div
      ref={fieldRef}
      className={styles.search}
      onClick={() => setIsOpen(true)}
    >
      <SvgSearch
        size="20"
        className={styles.search__icon}
        style={{ color: "var(--color-text-muted)" }}
      />
      <Input
        value={search}
        autoFocus={autoFocus}
        placeholder={
          list.gamesCount
            ? "Search for a game to add…"
            : "Search for a game to add the first one…"
        }
        aria-label="Search for a game to add"
        autoComplete="off"
        className={styles.search__input}
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
