import { FC } from "react";
import styles from "./GameButtons.module.scss";
import { ButtonGroup } from "../Button/ButtonGroup";
import { IGameResponse } from "@mooncellar/schemas";

export const GameButtons: FC<{ game: IGameResponse }> = ({ game }) => {
  const commonOptions = {
    style: { borderRadius: "var(--radius-x4)" },
    target: "_blank",
  };

  const encodedName = encodeURIComponent(game.name);

  const steamStore = game.externalPages?.find(
    (store) => store.name === "Steam"
  );

  return (
    <div className={styles.menu} onClick={(event) => event.stopPropagation()}>
      <ButtonGroup
        wrapperClassName={styles.actions}
        buttons={[
          {
            title: "Open in Steam",
            link: steamStore?.url ?? "",
            hidden: !steamStore?.url,
            ...commonOptions,
          },
          {
            title: "Open in IGDB",
            link:
              game.igdb?.url ||
              `https://www.igdb.com/search?type=1&q=${encodedName}`,
            hidden: !game.igdb?.gameId,
            ...commonOptions,
          },
          {
            title: "Open in HLTB",
            link: `https://howlongtobeat.com/game/${game.hltb?.hltbId}`,
            hidden: !game.hltb?.hltbId,
            ...commonOptions,
          },
          {
            title: "Open in VNDB",
            link: `https://vndb.org/${game.vndb?.vnId}`,
            hidden: !game.vndb?.vnId,
            ...commonOptions,
          },
          {
            title: "Search on Youtube",
            link: `https://www.youtube.com/results?search_query=${encodedName}`,
            ...commonOptions,
          },
          {
            title: "Search on RetroAchievements",
            link: `https://retroachievements.org/searchresults.php?s=${encodedName}&t=1`,
            ...commonOptions,
          },
          {
            title: "Search on HowLongToBeat",
            link: `https://howlongtobeat.com/?q=${encodedName}`,
            ...commonOptions,
          },
          {
            title: "Search on vndb",
            link: `https://vndb.org/v?sq=${encodedName}`,
            ...commonOptions,
          },
        ]}
      />
    </div>
  );
};
