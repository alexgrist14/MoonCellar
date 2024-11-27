import { FC, useEffect, useState } from "react";
import styles from "./WheelContainer.module.scss";
import { WheelComponent } from "@/src/lib/features/wheel";
import { useCommonStore } from "@/src/lib/shared/store/common.store";
import { useStatesStore } from "@/src/lib/shared/store/states.store";
import { GameCard } from "@/src/lib/shared/ui/GameCard";
import { Button } from "@/src/lib/shared/ui/Button";
import { useGauntletFiltersStore } from "@/src/lib/shared/store/filters.store";

export const WheelContainer: FC = () => {
  const { winner } = useCommonStore();
  const { royalGames, addRoyalGame, removeRoyalGame } =
    useGauntletFiltersStore();

  const { isFinished, segments, isLoading, isRoyal } = useStatesStore();

  const [colors, setColors] = useState<string[]>([]);

  useEffect(() => {
    const generateRandomColors = (hue: number): string[] => {
      return (
        segments?.map((_, i) => {
          const min = 10;
          const percent =
            i < segments.length / 2
              ? (70 / segments.length) * i
              : (70 / segments.length) * (segments.length - i + 1);

          const lightness = (percent > min ? percent : min) + "%";
          const saturation = "60%";

          return `hsl(${hue}, ${saturation}, ${lightness})`;
        }) || []
      );
    };

    setColors(generateRandomColors((200 + Math.random() * 20) ^ 0));
  }, [segments, isLoading]);

  return (
    <div className={styles.container}>
      <WheelComponent
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
          <GameCard game={winner} />
          {!isRoyal && (
            <Button
              color="accent"
              style={{ height: "30px" }}
              onClick={() => {
                !royalGames?.some((game) => game._id === winner._id)
                  ? addRoyalGame(winner)
                  : removeRoyalGame(winner);
              }}
            >
              {royalGames?.some((game) => game._id === winner._id)
                ? "Remove from"
                : "Add to"}{" "}
              royal games
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
