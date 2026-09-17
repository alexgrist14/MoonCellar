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
import { GamesCards } from "@/src/lib/shared/ui/GamesCards";
import { getListHref } from "@/src/lib/shared/ui/ListCard";
import { Pagination } from "@/src/lib/shared/ui/Pagination";
import { SectionTitle } from "@/src/lib/shared/ui/SectionTitle";
import {
  SvgArrow,
  SvgBurger,
  SvgClose,
  SvgLink,
  SvgLock,
  SvgPen,
} from "@/src/lib/shared/ui/svg";
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
  const [isManaging, setIsManaging] = useState(false);

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

  const moveGame = (gameId: string, direction: -1 | 1) => {
    const ids = list.games.map((game) => game.gameId);
    const from = ids.indexOf(gameId);
    const to = from + direction;

    if (from < 0 || to < 0 || to >= ids.length) return;

    const nextGames = [...list.games];

    [nextGames[from], nextGames[to]] = [nextGames[to], nextGames[from]];

    queryClient.setQueryData<ICustomListDetails>(listKey, {
      ...list,
      games: nextGames,
    });

    reorderGames(
      { id: list._id, gameIds: nextGames.map((game) => game.gameId) },
      {
        onError: () =>
          queryClient.invalidateQueries({ queryKey: listQueryKeys.all }),
      }
    );
  };

  const handleRemove = (game: IGameResponse) => {
    removeGame(
      { id: list._id, gameId: game._id },
      {
        onSuccess: () =>
          toast.success({
            description: `Removed ${game.name} from ${list.name}`,
          }),
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

  const renderManageControls = (game: IGameResponse) => {
    if (!isOwner || !isManaging) return null;

    const index = list.games.findIndex((item) => item.gameId === game._id);

    return (
      <div className={styles.manage}>
        <span className={styles.manage__position}>#{index + 1}</span>
        <Button
          color={ButtonColor.TRANSPARENT}
          className={styles.manage__button}
          aria-label={`Move ${game.name} earlier`}
          tooltip="Move earlier"
          disabled={index <= 0 || isReordering}
          onClick={() => moveGame(game._id, -1)}
        >
          <SvgArrow
            size="16"
            style={{ transform: "rotate(180deg)", color: "inherit" }}
          />
        </Button>
        <Button
          color={ButtonColor.TRANSPARENT}
          className={styles.manage__button}
          aria-label={`Move ${game.name} later`}
          tooltip="Move later"
          disabled={index >= list.games.length - 1 || isReordering}
          onClick={() => moveGame(game._id, 1)}
        >
          <SvgArrow size="16" style={{ color: "inherit" }} />
        </Button>
        <Button
          color={ButtonColor.TRANSPARENT}
          className={cn(styles.manage__button, styles.manage__button_remove)}
          aria-label={`Remove ${game.name}`}
          tooltip="Remove from list"
          disabled={isRemoving}
          onClick={() => handleRemove(game)}
        >
          <SvgClose size="12" style={{ color: "inherit" }} />
        </Button>
      </div>
    );
  };

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
              { name: "Lists", href: `/user/${user.userName}?list=lists` },
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
              {isOwner && !!list.gamesCount && (
                <Button
                  color={isManaging ? ButtonColor.ACCENT : ButtonColor.DEFAULT}
                  className={styles.actions__button}
                  onClick={() => setIsManaging((value) => !value)}
                >
                  {isManaging ? "Done" : "Manage"}
                </Button>
              )}
            </div>
          </header>
          {isOwner && (
            <div className={styles.search}>
              <ListGameSearch list={list} autoFocus={!list.gamesCount} />
              {isManaging && (
                <span className={styles.search__hint}>
                  Move games with the arrows under each cover. The order is
                  saved as you go.
                </span>
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
                additionalGameNode={renderManageControls}
              />
            </div>
          )}
        </Box>
        <div className={styles.navigation}>{navigation}</div>
      </div>
      <Pagination
        take={CUSTOM_LIST_GAMES_PAGE_SIZE}
        total={list.gamesCount}
        isFixed
        isDisabled={isGamesFetching}
        page={currentPage}
        onPageChange={changePage}
      />
    </>
  );
};
