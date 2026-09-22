"use client";

import { FC, useCallback, useMemo } from "react";
import { hashKey } from "@tanstack/react-query";
import styles from "./GamesPage.module.scss";
import { ExpandMenu } from "@/src/lib/shared/ui/ExpandMenu";
import { AppliedGameFilters, Filters } from "@/src/lib/features/filters/ui/Filters";
import { Loader } from "@/src/lib/shared/ui/Loader";
import { Pagination } from "@/src/lib/shared/ui/Pagination";
import { parseQueryFilters } from "@/src/lib/shared/utils/filters.utils";
import { Box } from "@/src/lib/shared/ui/Box";
import { BGImage } from "@/src/lib/shared/ui/BGImage";
import { Breadcrumbs } from "@/src/lib/shared/ui/Breadcrumbs";
import { useAdvancedRouter } from "@/src/lib/shared/hooks/useAdvancedRouter";
import { useMinimumLoading } from "@/src/lib/shared/hooks/useMinimumLoading";
import { useGamesSelectionStore } from "@/src/lib/shared/store/games-selection.store";
import { GamesCards } from "@/src/lib/widgets/game/GamesCards";
import { takeGames } from "@/src/lib/shared/constants/games.const";
import { GamesListMenu } from "@/src/lib/widgets/main";
import { SectionTitle } from "@/src/lib/shared/ui/SectionTitle";
import { useGamesQuery } from "@/src/lib/entities/game/api/game.queries";
import { gameQueryKeys } from "@/src/lib/entities/game/api/game.query-keys";
import { IGetGamesRequest } from "@mooncellar/schemas";
import { IGamesListResponse } from "@/src/lib/shared/types/games.type";

interface IGamesPageProps {
  initialParams?: IGetGamesRequest;
  initialData?: IGamesListResponse;
}

export const GamesPage: FC<IGamesPageProps> = ({
  initialParams,
  initialData,
}) => {
  const { asPath, pathname, query } = useAdvancedRouter();
  const isSelectMode = useGamesSelectionStore((state) => state.isSelectMode);
  const selected = useGamesSelectionStore((state) => state.selected);
  const toggleGame = useGamesSelectionStore((state) => state.toggleGame);

  const params = useMemo(
    () => ({
      ...parseQueryFilters(asPath),
      page: Number(query.get("page")) || 1,
      take: takeGames,
    }),
    [asPath, query]
  );

  const seededData = useMemo(() => {
    if (!initialData || !initialParams) return undefined;

    return hashKey(gameQueryKeys.list(params)) ===
      hashKey(gameQueryKeys.list(initialParams))
      ? initialData
      : undefined;
  }, [params, initialParams, initialData]);

  const { data, isLoading: isGamesLoading } = useGamesQuery(
    params,
    true,
    seededData
  );
  const isLoading = useMinimumLoading(isGamesLoading);

  const changePage = useCallback(
    (page: number) => {
      if (page === params.page) return;

      const nextQuery = new URLSearchParams(query.toString());

      nextQuery.set("page", page.toString());
      window.history.pushState(null, "", `${pathname}?${nextQuery}`);
    },
    [params.page, pathname, query]
  );

  const games = data?.results;
  const total = data?.total ?? 0;
  return (
    <>
      <BGImage />
      <ExpandMenu position="left" titleOpen="Filters">
        <Filters />
      </ExpandMenu>
      <ExpandMenu position="right" titleOpen="Manage">
        <GamesListMenu games={games} />
      </ExpandMenu>
      <Pagination
        take={takeGames}
        total={total}
        isFixed
        isDisabled={isLoading}
        page={params.page}
        onPageChange={changePage}
      />
      <Box
        contentStyle={{
          minHeight: "var(--page-height-available)",
          position: "relative",
          gap: "var(--gap-x4)",
        }}
      >
        <Breadcrumbs
          items={[
            { name: "Home", href: "/" },
            { name: "Games", href: "/games" },
          ]}
        />
        <SectionTitle as="h1">Games</SectionTitle>
        <AppliedGameFilters />
        {isLoading ? (
          <Loader type="pacman" />
        ) : !games?.length ? (
          <h2 className={styles.page__empty}>Games not found</h2>
        ) : (
          <GamesCards
            games={games}
            columns={6}
            isWithCombinedRating
            isWithoutScroll
            isSelectable={isSelectMode}
            selectedIds={selected}
            onSelectGame={toggleGame}
          />
        )}
      </Box>
    </>
  );
};
