"use client";

import { FC, useCallback, useEffect } from "react";
import styles from "./GauntletPage.module.scss";
import { ConsolesList } from "../../widgets/main";
import { IGDBApi } from "../../shared/api";
import { WheelContainer } from "../../widgets/wheel";
import { ExpandMenu } from "../../shared/ui/ExpandMenu";
import { useStatesStore } from "../../shared/store/states.store";
import classNames from "classnames";
import { useGamesStore } from "../../shared/store/games.store";
import { parseQueryFilters } from "../../shared/utils/filters.util";
import { useCommonStore } from "../../shared/store/common.store";
import { Filters } from "../../shared/ui/Filters";
import { BGImage } from "../../shared/ui/BGImage";
import { useAdvancedRouter } from "../../shared/hooks/useAdvancedRouter";

export const GauntletPage: FC = () => {
  const { asPath } = useAdvancedRouter();

  const { setGenres, setGameModes, setSystems, setThemes } = useCommonStore();
  const { setGames, historyGames, setWinner, winner } = useGamesStore();
  const {
    isLoading,
    setStarted,
    setFinished,
    setLoading,
    isRoyal,
    isExcludeHistory,
  } = useStatesStore();

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
        setGames(response.data.results);

        setStarted(true);
        setLoading(false);
        setWinner(undefined);
      } else {
        setLoading(false);
        setFinished(true);
        setWinner(undefined);
      }
    });
  }, [
    setLoading,
    setStarted,
    setWinner,
    isRoyal,
    historyGames,
    isExcludeHistory,
    asPath,
    setFinished,
    setGames,
  ]);

  useEffect(() => {
    if (isLoading && !isRoyal) {
      getIGDBGames();
    }
  }, [isLoading, getIGDBGames, isRoyal]);

  useEffect(() => {
    if (isRoyal) return;

    IGDBApi.getGenres().then((response) => setGenres(response.data));
    IGDBApi.getModes().then((response) => setGameModes(response.data));
    IGDBApi.getPlatforms().then((response) => setSystems(response.data));
    IGDBApi.getThemes().then((response) => setThemes(response.data));
  }, [isRoyal, setGenres, setGameModes, setSystems, setThemes]);

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
