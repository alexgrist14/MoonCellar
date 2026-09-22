import { FC, useState } from "react";
import styles from "./ConsolesList.module.scss";
import { Tabs } from "@/src/lib/shared/ui/Tabs";
import { useGamesStore } from "@/src/lib/shared/store/games.store";
import { GamesList } from "@/src/lib/widgets/game/GamesList";
import { RoyalGamesPanel } from "@/src/lib/widgets/main/RoyalGamesPanel";
import { useGamesByIdsQuery } from "@/src/lib/entities/game/api/game.queries";
import { useRoyalGames } from "@/src/lib/entities/royal/model/useRoyalGames";

export const ConsolesList: FC<{ initialTabIndex?: number }> = ({
  initialTabIndex,
}) => {
  const { games, historyGames, setHistoryGames, removeHistoryGame } =
    useGamesStore();
  const { royalGames } = useRoyalGames();

  const [tabIndex, setTabIndex] = useState(initialTabIndex || 0);

  const { data: royalGamesData } = useGamesByIdsQuery(royalGames || []);

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
      {tabIndex === 0 && <GamesList games={games || royalGamesData || []} />}
      {tabIndex === 1 && <RoyalGamesPanel />}
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
