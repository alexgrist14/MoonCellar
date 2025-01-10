import { FC, useEffect, useState } from "react";
import styles from "./WheelContainer.module.scss";
import { WheelComponent } from "@/src/lib/features/wheel";
import { useStatesStore } from "@/src/lib/shared/store/states.store";
import { GameCard } from "@/src/lib/shared/ui/GameCard";
import { useGamesStore } from "@/src/lib/shared/store/games.store";
import { RangeSelector } from "@/src/lib/shared/ui/RangeSelector";
import { WrapperTemplate } from "@/src/lib/shared/ui/WrapperTemplate";
import { shuffle } from "@/src/lib/shared/utils/common";
import { IGDBGameMinimal } from "@/src/lib/shared/types/igdb";
import { emptyGames } from "@/src/lib/shared/constants/games.const";
import { useCommonStore } from "@/src/lib/shared/store/common.store";
import { ButtonGroup } from "@/src/lib/shared/ui/Button/ButtonGroup";

export const WheelContainer: FC = () => {
  const { winner, games, royalGames, addRoyalGame, removeRoyalGame } =
    useGamesStore();
  const { isFinished, isLoading, isRoyal } = useStatesStore();
  const { timer, setTimer } = useCommonStore();

  const [colors, setColors] = useState<string[]>([]);
  const [wheelGames, setWheelGames] = useState<IGDBGameMinimal[]>([]);

  useEffect(() => {
    !isRoyal && !!games?.length && setWheelGames(shuffle(games));
  }, [games, isRoyal]);

  useEffect(() => {
    isRoyal &&
      setWheelGames(!!royalGames?.length ? shuffle(royalGames) : emptyGames);
  }, [royalGames, isRoyal]);

  useEffect(() => {
    !isRoyal && !wheelGames.length && setWheelGames(emptyGames);
  }, [wheelGames, isRoyal]);

  useEffect(() => {
    isRoyal &&
      !wheelGames.length &&
      setWheelGames(!!royalGames?.length ? shuffle(royalGames) : emptyGames);
  }, [wheelGames, isRoyal, royalGames]);

  useEffect(() => {
    const generateRandomColors = (hue: number): string[] => {
      return (
        wheelGames?.map((_, i) => {
          const min = 10;
          const percent =
            i < wheelGames.length / 2
              ? (70 / wheelGames.length) * i
              : (70 / wheelGames.length) * (wheelGames.length - i + 1);

          const lightness = (percent > min ? percent : min) + "%";
          const saturation = "60%";

          return `hsl(${hue}, ${saturation}, ${lightness})`;
        }) || []
      );
    };

    setColors(generateRandomColors((200 + Math.random() * 20) ^ 0));
  }, [wheelGames, isLoading]);

  return (
    <div className={styles.container}>
      <WrapperTemplate contentStyle={{ padding: "10px" }}>
        <RangeSelector
          min={0.1}
          max={20}
          step={0.1}
          defaultValue={timer}
          callback={(value) => setTimer(value)}
          text={`Time: ${timer} seconds`}
        />
      </WrapperTemplate>
      <WheelComponent
        wheelGames={wheelGames}
        setWheelGames={setWheelGames}
        time={timer}
        segColors={colors}
        primaryColor="black"
        contrastColor="white"
        buttonText={
          isLoading ? "Loading..." : !isFinished ? "Spinning..." : "Spin"
        }
        size={295}
      />
      {!!winner && (
        <div className={styles.winner}>
          <GameCard className={styles.winner__card} game={winner} />
          <WrapperTemplate contentStyle={{ padding: "10px" }}>
            <ButtonGroup
              wrapperClassName={styles.winner__actions}
              buttons={[
                {
                  color: "accent",
                  title:
                    (royalGames?.some((royal) => royal._id === winner._id)
                      ? "Remove from"
                      : "Add to") + " royal games",
                  callback: () => {
                    royalGames?.some((royal) => royal._id === winner._id)
                      ? removeRoyalGame(winner)
                      : addRoyalGame(winner);
                  },
                },
                {
                  title: "Search on Youtube",
                  link: `https://www.youtube.com/results?search_query=${winner.name}`,
                  target: "_blank",
                },
                {
                  title: "Search on RetroAchievements",
                  link: `https://retroachievements.org/searchresults.php?s=${winner.name}&t=1`,
                  target: "_blank",
                },
                {
                  title: "Search on HowLongToBeat",
                  link: `https://howlongtobeat.com/?q=${encodeURI(
                    winner.name
                  )}`,
                  target: "_blank",
                },
                {
                  title: "Open in IGDB",
                  link: winner.url,
                  isHidden: !winner.url,
                  target: "_blank",
                },
              ]}
            />
          </WrapperTemplate>
        </div>
      )}
    </div>
  );
};
