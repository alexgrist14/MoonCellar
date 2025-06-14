import { FC, useMemo } from "react";
import styles from "./GameButtons.module.scss";
import { ButtonGroup } from "../Button/ButtonGroup";
import { IGDBGameMinimal } from "../../types/igdb";
import { WrapperTemplate } from "../WrapperTemplate";
import { useGamesStore } from "../../store/games.store";

export const GameButtons: FC<{ game: IGDBGameMinimal }> = ({ game }) => {
  const { royalGames, addRoyalGame, removeRoyalGame } = useGamesStore();

  const isRoyal = useMemo(
    () => royalGames?.some((royal) => royal._id === game?._id),
    [game, royalGames]
  );

  return (
    <div className={styles.menu}>
      {!!game.raIds?.length && (
        <WrapperTemplate
          title="RetroAchievements"
          contentStyle={{ padding: "5px" }}
        >
          <ButtonGroup
            wrapperClassName={styles.actions}
            buttons={[
              ...game.raIds.map((game) => ({
                title: <span>{game.consoleName}</span>,
                link: `https://retroachievements.org/game/${game._id}`,
                target: "_blank",
              })),
            ]}
          />
        </WrapperTemplate>
      )}
      <WrapperTemplate contentStyle={{ padding: "5px" }}>
        <ButtonGroup
          wrapperClassName={styles.actions}
          buttons={[
            {
              title: (isRoyal ? "Remove from" : "Add to") + " Royal list",
              onClick: () =>
                isRoyal ? removeRoyalGame(game) : addRoyalGame(game),
            },
          ]}
        />
      </WrapperTemplate>
      <WrapperTemplate contentStyle={{ padding: "5px" }}>
        <ButtonGroup
          wrapperClassName={styles.actions}
          buttons={[
            {
              title: "Open in IGDB",
              link: game.url,
              hidden: !game.url,
              target: "_blank",
            },
            {
              title: "Search on Youtube",
              link: `https://www.youtube.com/results?search_query=${game.name}`,
              target: "_blank",
            },
            {
              title: "Search on RetroAchievements",
              link: `https://retroachievements.org/searchresults.php?s=${game.name}&t=1`,
              target: "_blank",
            },
            {
              title: "Search on HowLongToBeat",
              link: `https://howlongtobeat.com/?q=${encodeURI(game.name)}`,
              target: "_blank",
            },
          ]}
        />
      </WrapperTemplate>
    </div>
  );
};
