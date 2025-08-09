"use client";

import { FC, useCallback, useEffect } from "react";
import styles from "./GauntletPage.module.scss";
import { ConsolesList } from "../../widgets/main";
import { adminUsersApi, IGDBApi } from "../../shared/api";
import { WheelContainer } from "../../widgets/wheel";
import { ExpandMenu } from "../../shared/ui/ExpandMenu";
import { useStatesStore } from "../../shared/store/states.store";
import classNames from "classnames";
import { useGamesStore } from "../../shared/store/games.store";
import { parseQueryFilters } from "../../shared/utils/filters.utils";
import { Filters } from "../../shared/ui/Filters";
import { BGImage } from "../../shared/ui/BGImage";
import { useAdvancedRouter } from "../../shared/hooks/useAdvancedRouter";
import { useWheel } from "../../shared/hooks/useWheel";
import { shuffle } from "../../shared/utils/common.utils";

export const GauntletPage: FC = () => {
  const { asPath } = useAdvancedRouter();

  const { setGames, historyGames, winner } = useGamesStore();
  const {
    isLoading,
    setStarted,
    setFinished,
    setLoading,
    isRoyal,
    isExcludeHistory,
  } = useStatesStore();

  const { parseImages, drawWheel } = useWheel({});

  const getIGDBGames = useCallback(() => {
    if (isRoyal) return;

    const filters = parseQueryFilters(asPath);

    IGDBApi.getGames({
      ...filters,
      isRandom: true,
      take: 16,
      ...(isExcludeHistory &&
        !!historyGames?.length && {
          excludeGames: historyGames.map((game) => game._id),
        }),
    }).then((response) => {
      if (!!response.data.results.length) {
        const games = shuffle(response.data.results);

        setGames(games);
        parseImages(games).then((images) => {
          drawWheel({ images, wheelGames: games });

          setLoading(false);
          setStarted(true);
        });
      } else {
        setLoading(false);
        setFinished(true);
      }
    });
  }, [
    setLoading,
    isRoyal,
    historyGames,
    isExcludeHistory,
    asPath,
    setFinished,
    setGames,
    setStarted,
    parseImages,
    drawWheel,
  ]);

  useEffect(() => {
    if (isLoading && !isRoyal) {
      getIGDBGames();
    }
  }, [isLoading, getIGDBGames, isRoyal]);

  return (
    <div className={classNames(styles.page)}>
      {!isRoyal && (
        <ExpandMenu id="consoles" titleOpen="Filters" position="left">
          <Filters isGauntlet />
        </ExpandMenu>
      )}
      <ExpandMenu id="consoles" titleOpen="Lists" position="right">
        <ConsolesList />
      </ExpandMenu>
      <BGImage game={winner} />
      <WheelContainer />
    </div>
  );
};
