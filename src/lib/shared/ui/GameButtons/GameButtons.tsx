import { FC } from "react";
import styles from "./GameButtons.module.scss";
import { ButtonGroup } from "../Button/ButtonGroup";
import { IGameResponse } from "../../lib/schemas/games.schema";
import { Box } from "../Box";

export const GameButtons: FC<{ game: IGameResponse }> = ({ game }) => {
  const commonOptions = {
    style: { borderRadius: "var(--radius-x4)" },
    target: "_blank",
  };

  return (
    <Box className={styles.menu}>
      <ButtonGroup
        wrapperClassName={styles.actions}
        buttons={[
          {
            title: "Open in Steam",
            link: `https://store.steampowered.com/app/${game.steam?.gameId}`,
            hidden: !game.steam?.gameId,
            ...commonOptions,
          },
          {
            title: "Open in IGDB",
            link: "https://www.igdb.com/games/" + game.slug,
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
            title: "Search on Youtube",
            link: `https://www.youtube.com/results?search_query=${game.name}`,
            ...commonOptions,
          },
          {
            title: "Search on RetroAchievements",
            link: `https://retroachievements.org/searchresults.php?s=${game.name}&t=1`,
            ...commonOptions,
          },
          {
            title: "Search on HowLongToBeat",
            link: `https://howlongtobeat.com/?q=${encodeURI(game.name)}`,
            ...commonOptions,
          },
          {
            title: "Search on vndb",
            link: `https://vndb.org/v?sq=${encodeURI(game.name)}`,
            ...commonOptions,
          },
        ]}
      />
    </Box>
  );
};
