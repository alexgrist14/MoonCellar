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
import { userListCategories } from "@/src/lib/shared/constants/user.const";

interface UserGamesProps {
  games: UserGamesType;
}

export const UserGames: FC<UserGamesProps> = ({ games }) => {
  const [userGames, setUserGames] = useState<UserGamesType>(games);

   const tabs: ITabContent[] = userListCategories.map((tabName)=>({
    tabName,
    tabBody: (
      <div className={styles.content}>
        {games[tabName].map((game, i) => (
          <div key={i} className={styles.game}>
            <GameCard game={game} />
            <p className={styles.game_title}>{game.name}</p>
          </div>
        ))}
        {!games[tabName].length && <p>There is no games</p>

        }
      </div>
    ),
    className: `${styles.tabs__button}`,
   }))
  return (
    <div className={styles.container}>
      <Tabs contents={tabs} />
    </div>
  );
};
