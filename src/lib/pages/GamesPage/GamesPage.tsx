"use client";

import { FC, useMemo } from "react";
import { hashKey } from "@tanstack/react-query";
import styles from "./GamesPage.module.scss";
import { ExpandMenu } from "../../shared/ui/ExpandMenu";
import { Filters } from "../../shared/ui/Filters";
import { Loader } from "../../shared/ui/Loader";
import { Pagination } from "../../shared/ui/Pagination";
import { parseQueryFilters } from "../../shared/utils/filters.utils";
import { Box } from "../../shared/ui/Box";
import { BGImage } from "../../shared/ui/BGImage";
import { Breadcrumbs } from "../../shared/ui/Breadcrumbs";
import { useAdvancedRouter } from "../../shared/hooks/useAdvancedRouter";
import { GamesCards } from "../../shared/ui/GamesCards";
import { takeGames } from "../../shared/constants/games.const";
import { GamesListMenu } from "../../widgets/main";
import { SectionTitle } from "../../shared/ui/SectionTitle";
import { useGamesQuery } from "../../entities/game/api/game.queries";
import { gameQueryKeys } from "../../entities/game/api/game.query-keys";
import { IGetGamesRequest } from "../../shared/lib/schemas/games.schema";
import { IGamesListResponse } from "../../shared/types/games.type";

interface IGamesPageProps {
  initialParams?: IGetGamesRequest;
  initialData?: IGamesListResponse;
}

export const GamesPage: FC<IGamesPageProps> = ({
  initialParams,
  initialData,
}) => {
  const { asPath, query } = useAdvancedRouter();

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

  const { data, isPending, isFetching } = useGamesQuery(
    params,
    true,
    seededData
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
        isDisabled={isFetching}
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
        {isPending || isFetching ? (
          <Loader type="pacman" />
        ) : !games?.length ? (
          <h2 className={styles.page__empty}>Games not found</h2>
        ) : (
          <GamesCards games={games} isWithCombinedRating isWithoutScroll />
        )}
      </Box>
    </>
  );
};
