import { FC, useMemo } from "react";
import styles from "./GameButtons.module.scss";
import { ButtonGroup } from "../Button/ButtonGroup";
import { WrapperTemplate } from "../WrapperTemplate";
import { useGamesStore } from "../../store/games.store";
import { Separator } from "../Separator";
import { IGameResponse } from "../../lib/schemas/games.schema";
import { useCommonStore } from "../../store/common.store";

export const GameButtons: FC<{ game: IGameResponse }> = ({ game }) => {
  const { royalGames, addRoyalGame, removeRoyalGame } = useGamesStore();
  const { systems } = useCommonStore();

  const isRoyal = useMemo(
    () => royalGames?.some((royal) => royal._id === game?._id),
    [game, royalGames]
  );

  const raInfo = useMemo(() => {
    return game.retroachievements?.map((item) => {
      const platform = systems?.find((sys) => sys.raId === item.consoleId);

      return {
        platformName: platform?.name,
        gameId: item.gameId,
      };
    });
  }, [game.retroachievements, systems]);

  return (
    <div className={styles.menu}>
      {!!game.retroachievements?.length && (
        <>
          <WrapperTemplate
            title="RetroAchievements"
            contentStyle={{ padding: "5px" }}
            isWithoutBorder
          >
            <ButtonGroup
              wrapperClassName={styles.actions}
              buttons={[
                ...(raInfo?.map((item) => ({
                  title: <span>{item.platformName}</span>,
                  link: `https://retroachievements.org/game/${item.gameId}`,
                  target: "_blank",
                })) || []),
              ]}
            />
          </WrapperTemplate>
          <Separator direction="horizontal" />
        </>
      )}
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
      <Separator direction="horizontal" />
      <ButtonGroup
        wrapperClassName={styles.actions}
        buttons={[
          {
            title: "Open in IGDB",
            link: "https://www.igdb.com/games/" + game.slug,
            hidden: !game.igdb?.gameId,
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
    </div>
  );
};
