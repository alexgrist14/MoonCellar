import { FC, useMemo, useState } from "react";
import classNames from "classnames";
import { useSearchParams } from "next/navigation";
import {
  CustomListsOrderSchema,
  DEFAULT_STEAM_LIBRARY_ORDER,
  DEFAULT_STEAM_LIBRARY_SORT,
  ICustomListsOrder,
  ISteamAccount,
  ISteamLibrarySort,
  SteamLibrarySortSchema,
} from "@mooncellar/schemas";
import { useGamesByIdsQuery } from "@/src/lib/entities/game/api/game.queries";
import { useSteamLibraryQuery } from "@/src/lib/entities/user/api/user.queries";
import {
  AppliedGameFilters,
  Filters,
} from "@/src/lib/features/filters/ui/Filters";
import { pickListGameFilters } from "@/src/lib/shared/utils/filters.utils";
import { ExpandMenu } from "@/src/lib/shared/ui/ExpandMenu";
import {
  ISortControlOption,
  SortControl,
} from "@/src/lib/shared/ui/SortControl";
import { useGridRows } from "@/src/lib/shared/hooks/useGridRows";
import { GameCard } from "@/src/lib/widgets/game/GameCard";
import { Badge } from "@/src/lib/shared/ui/Badge";
import { Button, ButtonColor } from "@/src/lib/shared/ui/Button";
import { EmptyState } from "@/src/lib/shared/ui/EmptyState";
import { Loader } from "@/src/lib/shared/ui/Loader";
import { Pagination } from "@/src/lib/shared/ui/Pagination";
import { SectionTitle } from "@/src/lib/shared/ui/SectionTitle";
import { commonUtils } from "@/src/lib/shared/utils/common.utils";
import styles from "./UserSteamGames.module.scss";

const PREVIEW_LIMIT = 12;
const PREVIEW_ROWS = 2;
const PAGE_SIZE = 24;
const SORT_PARAM = "sort";
const ORDER_PARAM = "order";

const SORT_OPTIONS: ISortControlOption<ISteamLibrarySort>[] = [
  { value: "achievements", label: "Achievements" },
  { value: "playtime", label: "Playtime" },
  { value: "name", label: "Name" },
  { value: "release", label: "Release date" },
  { value: "rating", label: "Rating" },
];

const formatPlaytime = (minutes: number) =>
  minutes < 60 ? `${minutes} min` : `${Math.round(minutes / 60)} h`;

const CARD_STYLE = {
  width: "100%",
  minWidth: 0,
  maxWidth: "none",
  maxHeight: "none",
  padding: 0,
};

interface IUserSteamGamesProps {
  userName: string;
  steam?: ISteamAccount | null;
  isPreview?: boolean;
  onShowAll?: () => void;
}

export const UserSteamGames: FC<IUserSteamGamesProps> = ({
  userName,
  steam,
  isPreview,
  onShowAll,
}) => {
  const query = useSearchParams();
  const sortBy = isPreview
    ? DEFAULT_STEAM_LIBRARY_SORT
    : (SteamLibrarySortSchema.safeParse(query?.get(SORT_PARAM)).data ??
      DEFAULT_STEAM_LIBRARY_SORT);
  const sortOrder = isPreview
    ? DEFAULT_STEAM_LIBRARY_ORDER
    : (CustomListsOrderSchema.safeParse(query?.get(ORDER_PARAM)).data ??
      DEFAULT_STEAM_LIBRARY_ORDER);
  const filters = useMemo(
    () =>
      isPreview
        ? undefined
        : pickListGameFilters(`?${query?.toString() ?? ""}`),
    [isPreview, query]
  );
  const { data: library, isLoading: isLibraryLoading } = useSteamLibraryQuery(
    { userName, sortBy, sortOrder, filters },
    !!steam
  );
  const entries = useMemo(() => library?.games ?? [], [library]);
  const [page, setPage] = useState(1);
  const resultKey = JSON.stringify([sortBy, sortOrder, filters]);
  const [pageKey, setPageKey] = useState(resultKey);

  if (pageKey !== resultKey) {
    setPageKey(resultKey);
    setPage(1);
  }
  const shown = isPreview
    ? entries.slice(0, PREVIEW_LIMIT)
    : entries.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const { data: games = [], isLoading: isGamesLoading } = useGamesByIdsQuery(
    shown.map(({ gameId }) => gameId),
    undefined,
    shown.length > 0
  );
  const gameById = useMemo(
    () => new Map(games.map((game) => [game._id, game])),
    [games]
  );
  const items = shown.flatMap((entry) => {
    const game = gameById.get(entry.gameId);

    return game ? [{ ...entry, game }] : [];
  });
  const isLoading = isLibraryLoading || isGamesLoading;
  const masteredCount = entries.filter(
    ({ unlocked, total }) => !!total && (unlocked ?? 0) >= total
  ).length;

  const changeSort = (
    nextSortBy: ISteamLibrarySort,
    nextSortOrder: ICustomListsOrder
  ) => {
    const nextQuery = new URLSearchParams(query?.toString());
    const isDefault =
      nextSortBy === DEFAULT_STEAM_LIBRARY_SORT &&
      nextSortOrder === DEFAULT_STEAM_LIBRARY_ORDER;

    nextQuery.delete(SORT_PARAM);
    nextQuery.delete(ORDER_PARAM);

    if (!isDefault) {
      nextQuery.set(SORT_PARAM, nextSortBy);
      nextQuery.set(ORDER_PARAM, nextSortOrder);
    }

    const search = nextQuery.toString();

    window.history.pushState(
      null,
      "",
      `${window.location.pathname}${search ? `?${search}` : ""}`
    );
  };
  const { ref: gridRef, visibleCount } = useGridRows<HTMLUListElement>(
    items.length,
    isPreview ? PREVIEW_ROWS : undefined
  );

  if (isPreview && !entries.length) return null;

  return (
    <section className={styles.steam} aria-labelledby="profile-steam-games">
      <SectionTitle
        as="h3"
        count={library?.total || undefined}
        action={
          isPreview && (
            <Button
              color={ButtonColor.TRANSPARENT}
              onClick={onShowAll}
              aria-label="All Steam games"
            >
              All
            </Button>
          )
        }
      >
        <span id="profile-steam-games">Steam</span>
      </SectionTitle>

      {!isPreview && !!steam && (
        <ExpandMenu position="left" titleOpen="Filters">
          <Filters isSortHidden />
        </ExpandMenu>
      )}

      {!isPreview && !!steam && (
        <p className={styles.steam__note}>
          {masteredCount
            ? `${masteredCount} mastered ${commonUtils.addLastS("game", masteredCount)}. `
            : ""}
          Achievement progress of the{" "}
          <a
            href={`https://steamcommunity.com/profiles/${steam.steamId}`}
            target="_blank"
            rel="noreferrer"
          >
            Steam profile
          </a>
          {steam.achievementsSyncedAt
            ? `, updated ${commonUtils.getHumanDate(steam.achievementsSyncedAt)}.`
            : "."}
        </p>
      )}

      {!isPreview && !!steam && (
        <div className={styles.steam__toolbar}>
          <AppliedGameFilters />
          <SortControl
            className={styles.steam__sort}
            options={SORT_OPTIONS}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onChange={(by, order) => changeSort(by ?? sortBy, order)}
          />
        </div>
      )}

      {isLoading && <Loader type="pulse" />}

      {!isLoading && !items.length && (
        <EmptyState
          variant="inline"
          title={
            steam
              ? filters
                ? "No Steam games match these filters."
                : "None of the games on this Steam account are in the catalogue yet."
              : "No Steam account is linked."
          }
        />
      )}

      {!!items.length && (
        <ul
          ref={gridRef}
          className={isPreview ? styles.steam__preview : styles.steam__grid}
        >
          {items.map(
            ({ game, unlocked, total, masteredAt, playtime }, index) => {
              const hasProgress = !!unlocked && !!total;
              const isMastered = hasProgress && unlocked >= total;

              return (
                <li
                  key={game._id}
                  className={classNames(styles.steam__item, {
                    [styles.steam__item_hidden]: index >= visibleCount,
                  })}
                >
                  <GameCard game={game} style={CARD_STYLE} />
                  <div className={styles.steam__caption}>
                    {hasProgress ? (
                      <Badge tone={isMastered ? "attention" : "neutral"}>
                        {isMastered ? "Mastered" : `${unlocked} / ${total}`}
                      </Badge>
                    ) : (
                      <span />
                    )}
                    <span className={styles.steam__date}>
                      {isMastered && masteredAt
                        ? commonUtils.formatDate(masteredAt)
                        : hasProgress
                          ? `${Math.round((unlocked / total) * 100)}%`
                          : playtime
                            ? formatPlaytime(playtime)
                            : "Not played"}
                    </span>
                  </div>
                </li>
              );
            }
          )}
        </ul>
      )}
      {!isPreview && (
        <Pagination
          take={PAGE_SIZE}
          total={entries.length}
          page={page}
          onPageChange={setPage}
          isFixed
        />
      )}
    </section>
  );
};
