"use client";

import { useEffect, useState } from "react";
import styles from "./GamesPage.module.scss";
import { ExpandMenu } from "../../shared/ui/ExpandMenu";
import { Filters } from "../../shared/ui/Filters";
import { gamesApi } from "../../shared/api";
import { GameCard } from "../../shared/ui/GameCard";
import { useDebouncedCallback } from "use-debounce";
import { Loader } from "../../shared/ui/Loader";
import classNames from "classnames";
import { Pagination } from "../../shared/ui/Pagination";
import { useWindowResizeAction } from "../../shared/hooks";
import { screenGt, screenLg, screenMd, screenSm } from "../../shared/constants";
import { parseQueryFilters } from "../../shared/utils/filters.utils";
import { WrapperTemplate } from "../../shared/ui/WrapperTemplate";
import { BGImage } from "../../shared/ui/BGImage";
import { useAdvancedRouter } from "../../shared/hooks/useAdvancedRouter";
import { useAsyncLoader } from "../../shared/hooks/useAsyncLoader";
import { IGameResponse } from "../../shared/lib/schemas/games.schema";

export const GamesPage = () => {
  const { sync, isLoading, setIsLoading } = useAsyncLoader();
  const { asPath, query } = useAdvancedRouter();

  const [games, setGames] = useState<IGameResponse[]>();
  const [total, setTotal] = useState(0);
  const [take, setTake] = useState(80);

  const debouncedGamesFetch = useDebouncedCallback((page: number = 1) => {
    const filters = parseQueryFilters(asPath);

    sync(() =>
      gamesApi
        .getAll({
          ...filters,
          page: page || 1,
          take,
        })
        .then((res) => {
          setGames(res.data.results);
          setTotal(res.data.total);
        })
    );
  }, 200);

  useEffect(() => {
    debouncedGamesFetch(Number(query.get("page") as string));
  }, [debouncedGamesFetch, take, query]);

  useWindowResizeAction(() => {
    if (window.innerWidth >= screenGt) return setTake(42);
    if (window.innerWidth >= screenLg) return setTake(35);
    if (window.innerWidth >= screenMd) return setTake(28);
    if (window.innerWidth >= screenSm) return setTake(21);

    return setTake(14);
  });

  return (
    <>
      <BGImage />
      <ExpandMenu position="left">
        <Filters />
      </ExpandMenu>
      <Pagination
        take={take}
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
        }}
      >
        {isLoading ? (
          <Loader type="pacman" />
        ) : (
          <div
            className={classNames(styles.page__games, {
              [styles.page__games_loading]: isLoading,
            })}
          >
            {games?.map((game) => (
              <GameCard key={game._id} game={game} />
            ))}
          </div>
        )}
      </WrapperTemplate>
    </>
  );
};
