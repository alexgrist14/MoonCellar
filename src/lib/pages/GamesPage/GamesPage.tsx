"use client";

import { useMemo } from "react";
import styles from "./GamesPage.module.scss";
import { ExpandMenu } from "../../shared/ui/ExpandMenu";
import { Filters } from "../../shared/ui/Filters";
import { Loader } from "../../shared/ui/Loader";
import { Pagination } from "../../shared/ui/Pagination";
import { parseQueryFilters } from "../../shared/utils/filters.utils";
import { Box } from "../../shared/ui/Box";
import { BGImage } from "../../shared/ui/BGImage";
import { useAdvancedRouter } from "../../shared/hooks/useAdvancedRouter";
import { GamesCards } from "../../shared/ui/GamesCards";
import { takeGames } from "../../shared/constants/games.const";
import { GamesListMenu } from "../../widgets/main";
import { useGamesQuery } from "../../entities/game/api/game.queries";

export const GamesPage = () => {
  const { asPath, query } = useAdvancedRouter();

  const params = useMemo(
    () => ({
      ...parseQueryFilters(asPath),
      page: Number(query.get("page")) || 1,
      take: takeGames,
    }),
    [asPath, query]
  );

  const { data, isPending, isFetching } = useGamesQuery(params);

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
          minHeight: "calc(100vh - 155px)",
          position: "relative",
        }}
      >
        {isPending || isFetching ? (
          <Loader type="pacman" />
        ) : !games?.length ? (
          <h2 className={styles.page__empty}>Games not found</h2>
        ) : (
          <GamesCards games={games} />
        )}
      </Box>
    </>
  );
};
