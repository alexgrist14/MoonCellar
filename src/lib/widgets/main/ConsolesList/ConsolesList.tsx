import { FC, useState } from "react";
import styles from "./ConsolesList.module.scss";
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

  const [tabIndex, setTabIndex] = useState(initialTabIndex || 0);

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
                setTabIndex(0);
              },
            },
            {
              tabName:
                "Royal" +
                (!!royalGames?.length ? ` (${royalGames.length})` : ""),
              style: { flexBasis: "33%" },
              onTabClick: () => {
                setTabIndex(1);
              },
            },
            {
              tabName: "History",
              style: { flexBasis: "33%" },
              onTabClick: () => {
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
