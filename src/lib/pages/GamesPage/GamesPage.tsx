"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./GamesPage.module.scss";
import { ExpandMenu } from "../../shared/ui/ExpandMenu";
import { Filters } from "../../shared/ui/Filters";
import { gamesApi } from "../../shared/api";
import { useDebouncedCallback } from "use-debounce";
import { Loader } from "../../shared/ui/Loader";
import { Pagination } from "../../shared/ui/Pagination";
import { parseQueryFilters } from "../../shared/utils/filters.utils";
import { WrapperTemplate } from "../../shared/ui/WrapperTemplate";
import { BGImage } from "../../shared/ui/BGImage";
import { useAdvancedRouter } from "../../shared/hooks/useAdvancedRouter";
import { useAsyncLoader } from "../../shared/hooks/useAsyncLoader";
import { IGameResponse } from "../../shared/lib/schemas/games.schema";
import { GamesCards } from "../../shared/ui/GamesCards";
import { takeGames } from "../../shared/constants/games.const";

export const GamesPage = () => {
  const { sync, isLoading, setIsLoading } = useAsyncLoader();
  const { asPath, query } = useAdvancedRouter();

  const [games, setGames] = useState<IGameResponse[]>();
  const [total, setTotal] = useState(0);

  const firstRender = useRef(true);

  const debouncedGamesFetch = useDebouncedCallback((page: number = 1) => {
    const filters = parseQueryFilters(asPath);

    sync(() =>
      gamesApi
        .getAll({
          ...filters,
          page: page || 1,
          take: takeGames,
        })
        .then((res) => {
          setGames(res.data.results);
          setTotal(res.data.total);

          firstRender.current && (firstRender.current = false);
        })
    );
  }, 200);

  useEffect(() => {
    debouncedGamesFetch(Number(query.get("page") as string));
  }, [debouncedGamesFetch, query]);

  return (
    <>
      <BGImage />
      <ExpandMenu position="left">
        <Filters />
      </ExpandMenu>
      <Pagination
        take={takeGames}
        total={total}
        isFixed
        isDisabled={isLoading}
        callback={() => {
          setGames([]);
          setIsLoading(true);
        }}
      />
      <WrapperTemplate
        contentStyle={{
          minHeight: "calc(100vh - 155px)",
          padding: "0",
        }}
      >
        {isLoading || firstRender.current ? (
          <Loader type="pacman" />
        ) : !games?.length ? (
          <h2 className={styles.page__empty}>Games not found</h2>
        ) : (
          <GamesCards games={games} />
        )}
      </WrapperTemplate>
    </>
  );
};
