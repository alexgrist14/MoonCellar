"use client";

import {
  CSSProperties,
  FC,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { ListLikeButton } from "@/src/lib/features/lists/ui/ListLikeButton";
import Link from "next/link";
import cn from "classnames";
import { useSearchParams } from "next/navigation";
import { hashKey, useQueryClient } from "@tanstack/react-query";
import {
  CUSTOM_LIST_GAMES_PAGE_SIZE,
  ICustomListDetails,
  ICustomListGamesFilters,
  ICustomListGamesSort,
  ICustomListsOrder,
  IGameResponse,
  IPlaythrough,
} from "@mooncellar/schemas";
import {
  listQueryKeys,
  useListBySlugQuery,
  useRemoveListGameMutation,
  useReorderListMutation,
} from "@/src/lib/entities/list/api";
import { gameQueryKeys } from "@/src/lib/entities/game/api/game.query-keys";
import { useGamesByIdsQuery } from "@/src/lib/entities/game/api/game.queries";
import {
  AppliedGameFilters,
  Filters,
} from "@/src/lib/features/filters/ui/Filters";
import { ListGameSearch } from "@/src/lib/features/lists/ui/ListGameSearch";
import { ListGamesSort } from "@/src/lib/features/lists/ui/ListGamesSort";
import {
  LIST_ORDER_PARAM,
  LIST_SORT_PARAM,
  parseListSortQuery,
} from "@/src/lib/features/lists/model/list-sort-query.utils";
import { openListModal } from "@/src/lib/features/lists/ui/ListModal";
import {
  UserNavigation,
  UserNavigationMenu,
} from "@/src/lib/features/user/ui/UserNavigation";
import { refreshAuth } from "@/src/lib/shared/hooks/useAuthRefresh";
import { useIsAuthHydrated } from "@/src/lib/shared/hooks/useIsAuthHydrated";
import { useAuthStore } from "@/src/lib/shared/store/auth.store";
import { IUser } from "@/src/lib/shared/types/auth.type";
import { BGImage } from "@/src/lib/shared/ui/BGImage";
import { Box } from "@/src/lib/shared/ui/Box";
import { Breadcrumbs } from "@/src/lib/shared/ui/Breadcrumbs";
import { Button, ButtonColor } from "@/src/lib/shared/ui/Button";
import { EmptyState } from "@/src/lib/shared/ui/EmptyState";
import { ExpandMenu } from "@/src/lib/shared/ui/ExpandMenu";
import {
  GamesCards,
  getSnappedColumns,
} from "@/src/lib/widgets/game/GamesCards";
import { GameCoverImage } from "@/src/lib/entities/game/ui/GameCoverImage";
import { SortableGrid } from "@/src/lib/shared/ui/SortableGrid";
import {
  getListHref,
  getProfileHref,
} from "@/src/lib/shared/utils/links.utils";
import { Pagination } from "@/src/lib/shared/ui/Pagination";
import { SectionTitle } from "@/src/lib/shared/ui/SectionTitle";
import { SvgLink, SvgLock, SvgPen } from "@/src/lib/shared/ui/svg";
import { commonUtils } from "@/src/lib/shared/utils/common.utils";
import { pickListGameFilters } from "@/src/lib/shared/utils/filters.utils";
import { toast } from "@/src/lib/shared/utils/toast.utils";
import styles from "./CustomListPage.module.scss";

interface ICustomListPageProps {
  list: ICustomListDetails;
  user: IUser;
  playthroughs: IPlaythrough[];
  authUserId?: string;
  initialPage: number;
  initialGames: IGameResponse[];
}

const getPageIds = (list: ICustomListDetails, page: number) =>
  list.games
    .slice(
      (page - 1) * CUSTOM_LIST_GAMES_PAGE_SIZE,
      page * CUSTOM_LIST_GAMES_PAGE_SIZE
    )
    .map((game) => game.gameId);

export const CustomListPage: FC<ICustomListPageProps> = ({
  list: initialList,
  user,
  playthroughs,
  authUserId,
  initialPage,
  initialGames,
}) => {
  const query = useSearchParams();
  const queryClient = useQueryClient();
  const authProfile = useAuthStore((s) => s.profile);
  const isAuthHydrated = useIsAuthHydrated();

  const viewerId =
    !isAuthHydrated || authProfile?._id === authUserId ? authUserId : undefined;

  useEffect(() => {
    if (authUserId && !viewerId) {
      refreshAuth();
    }
  }, [authUserId, viewerId]);

  useState(() => {
    const ids = getPageIds(initialList, initialPage);

    if (ids.length && initialGames.length === ids.length) {
      queryClient.setQueryData(gameQueryKeys.byIds(ids), initialGames);
    }
  });

  const sort = useMemo(
    () => parseListSortQuery((key) => query.get(key)),
    [query]
  );
  const [initialSort] = useState(sort);
  const gameFilters = useMemo(
    () => pickListGameFilters(`?${query.toString()}`),
    [query]
  );
  const listKey = listQueryKeys.bySlug(
    user.userName,
    initialList.slug,
    sort,
    gameFilters
  );
  const { data: list = initialList, isPlaceholderData: isSorting } =
    useListBySlugQuery(
      user.userName,
      initialList.slug,
      sort,
      !gameFilters && hashKey([sort]) === hashKey([initialSort])
        ? initialList
        : undefined,
      gameFilters
    );
  const shownCount = list.games.length;
  const sortBy = sort.sortBy ?? list.sortBy;
  const sortOrder = sort.sortOrder ?? list.sortOrder;

  const isOwner = !!viewerId && viewerId === list.userId;
  const canEditGames = isOwner && !list.source;
  const [draft, setDraft] = useState<string[] | null>(null);
  const isManaging = !!draft;

  const page = Math.max(1, Number(query.get("page")) || initialPage);
  const lastPage = Math.max(
    1,
    Math.ceil(shownCount / CUSTOM_LIST_GAMES_PAGE_SIZE)
  );
  const currentPage = Math.min(page, lastPage);

  const pageIds = useMemo(
    () => getPageIds(list, currentPage),
    [list, currentPage]
  );

  const { data: fetchedGames, isFetching: isGamesFetching } =
    useGamesByIdsQuery(pageIds);
  const [knownGames, setKnownGames] = useState(initialGames);

  useEffect(() => {
    if (fetchedGames?.length) {
      setKnownGames((previous) => [...previous, ...fetchedGames]);
    }
  }, [fetchedGames]);

  const games = useMemo(() => {
    const byId = new Map(
      [...knownGames, ...(fetchedGames ?? [])].map((game) => [game._id, game])
    );

    return pageIds.flatMap((id) => {
      const game = byId.get(id);

      return game ? [game] : [];
    });
  }, [fetchedGames, knownGames, pageIds]);

  const listIds = useMemo(
    () =>
      [...list.games]
        .sort((a, b) => a.position - b.position)
        .map((game) => game.gameId),
    [list.games]
  );
  const { data: allGames, isFetching: isAllGamesFetching } = useGamesByIdsQuery(
    listIds,
    undefined,
    isManaging
  );
  const allGamesById = useMemo(
    () => new Map((allGames ?? []).map((game) => [game._id, game])),
    [allGames]
  );

  const { mutate: removeGame, isPending: isRemoving } =
    useRemoveListGameMutation();
  const { mutate: reorderGames, isPending: isReordering } =
    useReorderListMutation();

  const changePage = useCallback(
    (nextPage: number) => {
      if (nextPage === currentPage) return;

      const nextQuery = new URLSearchParams(query.toString());

      nextQuery.set("page", nextPage.toString());
      window.history.pushState(null, "", `${getListHref(list)}?${nextQuery}`);
    },
    [currentPage, list, query]
  );

  const changeSort = (
    nextSortBy: ICustomListGamesSort,
    nextSortOrder: ICustomListsOrder
  ) => {
    const nextQuery = new URLSearchParams(query.toString());
    const isDefault =
      nextSortBy === list.sortBy && nextSortOrder === list.sortOrder;

    nextQuery.delete("page");
    nextQuery.delete(LIST_SORT_PARAM);
    nextQuery.delete(LIST_ORDER_PARAM);

    if (!isDefault) {
      nextQuery.set(LIST_SORT_PARAM, nextSortBy);
      nextQuery.set(LIST_ORDER_PARAM, nextSortOrder);
    }

    const search = nextQuery.toString();

    window.history.pushState(
      null,
      "",
      `${getListHref(list)}${search ? `?${search}` : ""}`
    );
  };

  const finishManaging = () => {
    if (!draft) return;

    const isUnchanged =
      draft.length === listIds.length &&
      draft.every((id, index) => id === listIds[index]);

    if (isUnchanged) {
      setDraft(null);
      return;
    }

    const byId = new Map(list.games.map((game) => [game.gameId, game]));

    reorderGames(
      { id: list._id, gameIds: draft },
      {
        onSuccess: () => {
          if (sortBy === "position") {
            const games = draft.flatMap((id, index) => {
              const game = byId.get(id);

              return game ? [{ ...game, position: index + 1 }] : [];
            });

            queryClient.setQueryData<ICustomListDetails>(listKey, {
              ...list,
              games: sortOrder === "asc" ? games : games.reverse(),
            });
          }
          setDraft(null);
          toast.success({ description: "Order saved" });
        },
        onError: () => toast.error({ description: "Could not save the order" }),
      }
    );
  };

  const handleRemove = (gameId: string) => {
    const name = allGamesById.get(gameId)?.name ?? "the game";

    removeGame(
      { id: list._id, gameId },
      {
        onSuccess: () => {
          setDraft((ids) => ids?.filter((id) => id !== gameId) ?? null);
          toast.success({ description: `Removed ${name} from ${list.name}` });
        },
      }
    );
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}${getListHref(list)}`
      );
      toast.success({ description: "Link copied" });
    } catch {
      toast.error({ description: "Could not copy the link" });
    }
  };

  const navigationProps = {
    user,
    isAuthedUser: !!viewerId && viewerId === user._id,
    playthroughs,
  };

  const getRank = (game: IGameResponse) =>
    list.games.find((item) => item.gameId === game._id)?.position;

  const navigation = <UserNavigation {...navigationProps} />;

  return (
    <>
      <BGImage userImage={user.background} />
      {!isManaging && (
        <ExpandMenu position="left" titleOpen="Filters">
          <Filters isSortHidden />
        </ExpandMenu>
      )}
      <div className={styles.container}>
        <UserNavigationMenu {...navigationProps} />
        <Box classNameContent={styles.content}>
          <Breadcrumbs
            items={[
              { name: "Home", href: "/" },
              { name: user.userName, href: `/user/${user.userName}` },
              { name: "Lists", href: getProfileHref(user.userName, "lists") },
              { name: list.name, href: getListHref(list) },
            ]}
          />
          <header className={styles.head}>
            <div className={styles.head__main}>
              <SectionTitle as="h1" className={styles.title}>
                {list.name}
              </SectionTitle>
              <AppliedGameFilters />
              {!!list.description && (
                <p className={styles.description}>{list.description}</p>
              )}
              <p className={styles.meta}>
                <span>
                  by{" "}
                  <Link
                    href={`/user/${user.userName}`}
                    className={styles.meta__author}
                  >
                    {user.userName}
                  </Link>
                </span>
                <span>
                  {list.gamesCount}{" "}
                  {commonUtils.addLastS("game", list.gamesCount)}
                </span>
                <span>Updated {commonUtils.getHumanDate(list.updatedAt)}</span>
                <span className={styles.meta__privacy}>
                  {list.isPrivate ? (
                    <>
                      <SvgLock size="12" style={{ color: "inherit" }} />
                      Private
                    </>
                  ) : (
                    "Public"
                  )}
                </span>
              </p>
              {list.source && (
                <p className={styles.note}>
                  Imported from {isOwner ? "your" : `${user.userName}’s`} Steam
                  library.{" "}
                  {isOwner && (
                    <>
                      Update it or unlink Steam in{" "}
                      <Link href={getProfileHref(user.userName, "settings")}>
                        Settings
                      </Link>
                      .
                    </>
                  )}
                </p>
              )}
              {list.isPrivate && isOwner && (
                <p className={styles.note}>
                  Only you can see this list. Anyone else opening its link gets
                  “Page not found”.
                </p>
              )}
            </div>
            <div className={styles.actions}>
              {!list.isPrivate && (
                <ListLikeButton list={list} viewerId={viewerId} />
              )}
              {isOwner && (
                <Button
                  color={ButtonColor.DEFAULT}
                  onClick={() =>
                    openListModal({ list, userName: user.userName })
                  }
                >
                  <SvgPen />
                  Edit
                </Button>
              )}
              {!list.isPrivate && (
                <Button color={ButtonColor.DEFAULT} onClick={handleCopyLink}>
                  <SvgLink size="16" style={{ color: "inherit" }} />
                  Copy link
                </Button>
              )}
              {canEditGames &&
                !gameFilters &&
                !isManaging &&
                !!list.gamesCount && (
                  <Button
                    color={ButtonColor.DEFAULT}
                    onClick={() => setDraft(listIds)}
                  >
                    Manage
                  </Button>
                )}
              {isManaging && (
                <>
                  <Button
                    color={ButtonColor.DEFAULT}
                    disabled={isReordering}
                    onClick={() => setDraft(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    color={ButtonColor.ACCENT}
                    disabled={isReordering || isRemoving}
                    onClick={finishManaging}
                  >
                    Done
                  </Button>
                </>
              )}
            </div>
          </header>
          {(canEditGames || (!isManaging && list.gamesCount > 1)) && (
            <div className={styles.toolbar}>
              {canEditGames &&
                (isManaging ? (
                  <span className={styles.toolbar__hint}>
                    Drag or use the arrows to reorder. Press Done to save the
                    order.
                  </span>
                ) : (
                  <ListGameSearch list={list} autoFocus={!list.gamesCount} />
                ))}
              {!isManaging && list.gamesCount > 1 && (
                <ListGamesSort
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onChange={changeSort}
                  className={styles.toolbar__sort}
                />
              )}
            </div>
          )}
          {!!list.gamesCount && !shownCount ? (
            <EmptyState
              className={styles.empty}
              title="No games match the filters"
              description="Change or clear the filters to see the rest of the list."
            />
          ) : !list.gamesCount ? (
            <EmptyState
              className={styles.empty}
              title="This list is empty"
              description={
                list.source
                  ? "None of the games in this Steam library are in the catalogue yet."
                  : isOwner
                    ? "Search for a game to add the first one. You can also add games from any game card."
                    : `${user.userName} has not added any games yet.`
              }
            />
          ) : isManaging ? (
            <div
              className={styles.editor}
              style={
                getSnappedColumns(CUSTOM_LIST_GAMES_PAGE_SIZE) as CSSProperties
              }
            >
              <SortableGrid
                items={draft}
                getKey={(id) => id}
                getName={(id) => allGamesById.get(id)?.name ?? ""}
                renderCover={(id) => {
                  const game = allGamesById.get(id);

                  return game ? (
                    <GameCoverImage game={game} sizes="260px" />
                  ) : null;
                }}
                onChange={setDraft}
                onRemove={handleRemove}
                coverRatio="var(--cover-ratio)"
                isDisabled={isReordering || isRemoving}
                className={cn(styles.grid, styles.grid_editor, {
                  [styles.grid_fetching]: isAllGamesFetching && !allGames,
                })}
              />
            </div>
          ) : (
            <div
              className={cn(styles.grid, {
                [styles.grid_fetching]:
                  isSorting || (isGamesFetching && !fetchedGames),
              })}
            >
              <GamesCards
                games={games}
                limit={CUSTOM_LIST_GAMES_PAGE_SIZE}
                isWithoutScroll
                gameClassName={styles.grid__cell}
                getRank={list.isRanked ? getRank : undefined}
              />
            </div>
          )}
        </Box>
        <div className={styles.navigation}>{navigation}</div>
      </div>
      {!isManaging && (
        <Pagination
          take={CUSTOM_LIST_GAMES_PAGE_SIZE}
          total={shownCount}
          isFixed
          isDisabled={isGamesFetching}
          page={currentPage}
          onPageChange={changePage}
        />
      )}
    </>
  );
};
