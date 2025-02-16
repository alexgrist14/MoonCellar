import { FC } from "react";
import styles from "./GameButtons.module.scss";
import { ButtonGroup } from "../Button/ButtonGroup";
import { IGDBGameMinimal } from "../../types/igdb";
import { WrapperTemplate } from "../WrapperTemplate";

export const GameButtons: FC<{ game: IGDBGameMinimal }> = ({ game }) => {
  return (
    <>
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
      <ButtonGroup
        wrapperClassName={styles.actions}
        buttons={[
          {
            title: "Open in IGDB",
            link: game.url,
            isHidden: !game.url,
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
    </>
  );
};
