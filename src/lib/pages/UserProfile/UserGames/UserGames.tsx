import { FC, useState } from "react";
import styles from "./UserGames.module.scss";
import { IGDBGame } from "@/src/lib/shared/types/igdb";
import {
  categoriesType,
  UserGamesType,
} from "@/src/lib/shared/types/user.type";
import { GameCard } from "@/src/lib/shared/ui/GameCard";
import { Tabs } from "@/src/lib/shared/ui/Tabs";
import { ITabContent } from "@/src/lib/shared/types/tabs";

interface UserGamesProps {
  games: UserGamesType;
}

export const UserGames: FC<UserGamesProps> = ({ games }) => {
  const [userGames, setUserGames] = useState<UserGamesType>(games);

  const tabs: ITabContent[] = [
    {
      tabName: "Completed",
      tabBody: (
        <div className={styles.content}>
          {games.completed.map((game, i) => (
            <div key={i} className={styles.game}>
              <GameCard game={game} />
              <p className={styles.game_title}>{game.name}</p>
            </div>
          ))}
        </div>
      ),
      className: `${styles.tabs__button}`,
    },
    {
      tabName: "Playing",
      tabBody: <div className={styles.content}>
      {games.playing.map((game, i) => (
        <div key={i} className={styles.game}>
          <GameCard game={game} />
          <p className={styles.game_title}>{game.name}</p>
        </div>
      ))}
    </div>,
      className: `${styles.tabs__button}`,
    },
    {
      tabName: "Backlog",
      tabBody: <div className={styles.content}>
      {games.backlog.map((game, i) => (
        <div key={i} className={styles.game}>
          <GameCard game={game} />
          <p className={styles.game_title}>{game.name}</p>
        </div>
      ))}
    </div>,
      className: `${styles.tabs__button}`,
    },
    {
      tabName: "Wishlist",
      tabBody: <div className={styles.content}>
      {games.wishlist.map((game, i) => (
        <div key={i} className={styles.game}>
          <GameCard game={game} />
          <p className={styles.game_title}>{game.name}</p>
        </div>
      ))}
    </div>,
      className: `${styles.tabs__button}`,
    },
    {
      tabName: "Dropped",
      tabBody: <div className={styles.content}>
      {games.dropped.map((game, i) => (
        <div key={i} className={styles.game}>
          <GameCard game={game} />
          <p className={styles.game_title}>{game.name}</p>
        </div>
      ))}
    </div>,
      className: `${styles.tabs__button}`,
    },
  ];

  return (
    <div className={styles.container}>
      <Tabs contents={tabs} />
    </div>
  );
};
