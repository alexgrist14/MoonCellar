"use client";

import { FC, useCallback, useEffect, useMemo, useState } from "react";
import { ListLikeButton } from "@/src/lib/features/lists/ui/ListLikeButton";
import Link from "next/link";
import cn from "classnames";
import { useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  CUSTOM_LIST_GAMES_PAGE_SIZE,
  ICustomListDetails,
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
import { ListGameSearch } from "@/src/lib/features/lists/ui/ListGameSearch";
import { openListModal } from "@/src/lib/features/lists/ui/ListModal";
import { UserNavigation } from "@/src/lib/features/user/ui/UserNavigation";
import { refreshAuth } from "@/src/lib/shared/hooks/useAuthRefresh";
import { useAuthStore } from "@/src/lib/shared/store/auth.store";
import { useStatesStore } from "@/src/lib/shared/store/states.store";
import { IUser } from "@/src/lib/shared/types/auth.type";
import { BGImage } from "@/src/lib/shared/ui/BGImage";
import { Box } from "@/src/lib/shared/ui/Box";
import { Breadcrumbs } from "@/src/lib/shared/ui/Breadcrumbs";
import { Button, ButtonColor } from "@/src/lib/shared/ui/Button";
import { EmptyState } from "@/src/lib/shared/ui/EmptyState";
import { ExpandMenu } from "@/src/lib/shared/ui/ExpandMenu";
import { GamesCards } from "@/src/lib/widgets/game/GamesCards";
import { GameCoverImage } from "@/src/lib/entities/game/ui/GameCoverImage";
import { SortableGrid } from "@/src/lib/shared/ui/SortableGrid";
import {
  getListHref,
  getProfileHref,
} from "@/src/lib/shared/utils/links.utils";
import { Pagination } from "@/src/lib/shared/ui/Pagination";
import { SectionTitle } from "@/src/lib/shared/ui/SectionTitle";
import { SvgBurger, SvgLink, SvgLock, SvgPen } from "@/src/lib/shared/ui/svg";
import { commonUtils } from "@/src/lib/shared/utils/common.utils";
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
  const { isMobile } = useStatesStore();
  const authProfile = useAuthStore((s) => s.profile);

  const viewerId =
    typeof window === "undefined" || authProfile?._id === authUserId
      ? authUserId
      : undefined;

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

  const listKey = listQueryKeys.bySlug(user.userName, initialList.slug);
  const { data: list = initialList } = useListBySlugQuery(
    user.userName,
    initialList.slug,
    initialList
  );

  const isOwner = !!viewerId && viewerId === list.userId;
  const [draft, setDraft] = useState<string[] | null>(null);
  const isManaging = !!draft;

  const page = Math.max(1, Number(query.get("page")) || initialPage);
  const lastPage = Math.max(
    1,
    Math.ceil(list.gamesCount / CUSTOM_LIST_GAMES_PAGE_SIZE)
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
    () => list.games.map((game) => game.gameId),
    [list.games]
  );
  const { data: allGames, isFetching: isAllGamesFetching } =
    useGamesByIdsQuery(listIds, undefined, isManaging);
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
          queryClient.setQueryData<ICustomListDetails>(listKey, {
            ...list,
            games: draft.flatMap((id) => byId.get(id) ?? []),
          });
          setDraft(null);
          toast.success({ description: "Order saved" });
        },
        onError: () =>
          toast.error({ description: "Could not save the order" }),
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
    list.games.findIndex((item) => item.gameId === game._id) + 1 || undefined;

  const navigation = <UserNavigation {...navigationProps} />;

  return (
    <>
      <BGImage userImage={user.background} />
      <div className={styles.container}>
        {isMobile && (
          <ExpandMenu
            position="bottom-right"
            titleClose={
              <span className={styles.button__title}>
                <SvgBurger
                  size="32"
                  topId={cn(styles.top, styles.top_active)}
                  middleId={cn(styles.middle, styles.middle_active)}
                  bottomId={cn(styles.bottom, styles.bottom_active)}
                />
                Close
              </span>
            }
            titleOpen={
              <span className={styles.button__title}>
                <SvgBurger
                  size="32"
                  topId={cn(styles.top)}
                  middleId={cn(styles.middle)}
                  bottomId={cn(styles.bottom)}
                />
                Menu
              </span>
            }
            titleStyle={{ width: "fit-content" }}
          >
            {navigation}
          </ExpandMenu>
        )}
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
              {list.isPrivate && isOwner && (
                <p className={styles.note}>
                  Only you can see this list. Anyone else opening its link gets
                  “Page not found”.
                </p>
              )}
            </div>
            <div className={styles.actions}>
              {!list.isPrivate && (
                <ListLikeButton
                  list={list}
                  viewerId={viewerId}
                  className={styles.actions__button}
                />
              )}
              {isOwner && (
                <Button
                  color={ButtonColor.DEFAULT}
                  className={styles.actions__button}
                  onClick={() =>
                    openListModal({ list, userName: user.userName })
                  }
                >
                  <SvgPen />
                  Edit
                </Button>
              )}
              {!list.isPrivate && (
                <Button
                  color={ButtonColor.DEFAULT}
                  className={styles.actions__button}
                  onClick={handleCopyLink}
                >
                  <SvgLink size="16" style={{ color: "inherit" }} />
                  Copy link
                </Button>
              )}
              {isOwner && !isManaging && !!list.gamesCount && (
                <Button
                  color={ButtonColor.DEFAULT}
                  className={styles.actions__button}
                  onClick={() => setDraft(listIds)}
                >
                  Manage
                </Button>
              )}
              {isManaging && (
                <>
                  <Button
                    color={ButtonColor.DEFAULT}
                    className={styles.actions__button}
                    disabled={isReordering}
                    onClick={() => setDraft(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    color={ButtonColor.ACCENT}
                    className={styles.actions__button}
                    disabled={isReordering || isRemoving}
                    onClick={finishManaging}
                  >
                    Done
                  </Button>
                </>
              )}
            </div>
          </header>
          {isOwner && (
            <div className={styles.search}>
              {isManaging ? (
                <span className={styles.search__hint}>
                  Drag or use the arrows to reorder. Press Done to save the
                  order.
                </span>
              ) : (
                <ListGameSearch list={list} autoFocus={!list.gamesCount} />
              )}
            </div>
          )}
          {!list.gamesCount ? (
            <EmptyState
              className={styles.empty}
              title="This list is empty"
              description={
                isOwner
                  ? "Search for a game to add the first one. You can also add games from any game card."
                  : `${user.userName} has not added any games yet.`
              }
            />
          ) : isManaging ? (
            <SortableGrid
              items={draft}
              getKey={(id) => id}
              getName={(id) => allGamesById.get(id)?.name ?? ""}
              renderCover={(id) => {
                const game = allGamesById.get(id);

                return game ? (
                  <GameCoverImage game={game} sizes="160px" />
                ) : null;
              }}
              onChange={setDraft}
              onRemove={handleRemove}
              coverRatio="var(--cover-ratio)"
              isDisabled={isReordering || isRemoving}
              className={cn(styles.grid, {
                [styles.grid_fetching]: isAllGamesFetching && !allGames,
              })}
            />
          ) : (
            <div
              className={cn(styles.grid, {
                [styles.grid_fetching]: isGamesFetching && !fetchedGames,
              })}
            >
              <GamesCards
                games={games}
                limit={CUSTOM_LIST_GAMES_PAGE_SIZE}
                isWithCombinedRating
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
          total={list.gamesCount}
          isFixed
          isDisabled={isGamesFetching}
          page={currentPage}
          onPageChange={changePage}
        />
      )}
    </>
  );
};
