import { FC, useEffect, useState } from "react";
import styles from "./ConsolesList.module.scss";
import { IGDBApi } from "@/src/lib/shared/api";
import { useStatesStore } from "@/src/lib/shared/store/states.store";
import { useCommonStore } from "@/src/lib/shared/store/common.store";
import { Tabs } from "@/src/lib/shared/ui/Tabs";
import { useGamesStore } from "@/src/lib/shared/store/games.store";
import { GamesList } from "@/src/lib/shared/ui/GamesList";

export const ConsolesList: FC<{ initialTabIndex?: number }> = ({
  initialTabIndex,
}) => {
  const {
    games,
    royalGames,
    setRoyalGames,
    removeRoyalGame,
    historyGames,
    setHistoryGames,
    removeHistoryGame,
  } = useGamesStore();
  const { setGenres, setGameModes, setSystems, setThemes } = useCommonStore();
  const { setRoyal, isRoyal } = useStatesStore();

  const [tabIndex, setTabIndex] = useState(initialTabIndex || 0);

  useEffect(() => {
    if (isRoyal) return;

    IGDBApi.getGenres().then((response) => setGenres(response.data));
    IGDBApi.getModes().then((response) => setGameModes(response.data));
    IGDBApi.getPlatforms().then((response) => setSystems(response.data));
    IGDBApi.getThemes().then((response) => setThemes(response.data));
  }, [isRoyal, setGenres, setGameModes, setSystems, setThemes]);

  return (
    <div className={styles.consoles__list}>
      <div className={styles.consoles__options}>
        <Tabs
          defaultTabIndex={tabIndex}
          contents={[
            {
              tabName: "Gauntlet",
              style: { flexBasis: "33%" },
              onTabClick: () => {
                setRoyal(false);
                setTabIndex(0);
              },
            },
            {
              tabName:
                "Royal" +
                (!!royalGames?.length ? ` (${royalGames.length})` : ""),
              style: { flexBasis: "33%" },
              onTabClick: () => {
                setRoyal(true);
                setTabIndex(1);
              },
            },
            {
              tabName: "History",
              style: { flexBasis: "33%" },
              onTabClick: () => {
                setRoyal(false);
                setTabIndex(2);
              },
            },
          ]}
        />
      </div>
      {tabIndex === 0 && <GamesList games={games || royalGames || []} />}
      {tabIndex === 1 && (
        <GamesList
          games={royalGames || []}
          getGames={(games) => setRoyalGames(games)}
          removeGame={(game) => removeRoyalGame(game)}
        />
      )}
      {tabIndex === 2 && (
        <GamesList
          games={historyGames || []}
          getGames={(games) => setHistoryGames(games)}
          removeGame={(game) => removeHistoryGame(game)}
        />
      )}
    </div>
  );
};
