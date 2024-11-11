import { FC, useEffect, useState } from "react";
import styles from "./WheelContainer.module.scss";
import { WheelComponent } from "@/src/lib/features/wheel";
import { useCommonStore } from "@/src/lib/shared/store/common.store";
import { useStatesStore } from "@/src/lib/shared/store/states.store";
import { GameCard } from "@/src/lib/shared/ui/GameCard";
import { useSelectedStore } from "@/src/lib/shared/store/selected.store";
import { Button } from "@/src/lib/shared/ui/Button";

export const WheelContainer: FC = () => {
  const { winner } = useCommonStore();
  const { setRoyalGames, royalGames, isRoyal } = useSelectedStore();

  const { isFinished, segments, isLoading } = useStatesStore();

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

    segments?.some((segment) => !segment) &&
      setColors(generateRandomColors((200 + Math.random() * 20) ^ 0));
  }, [segments, isLoading]);

  console.log(winner);

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
              style={{ height: "30px" }}
              onClick={() => {
                !royalGames?.some((game) => game._id === winner._id)
                  ? setRoyalGames([
                      ...(!!royalGames?.length ? royalGames : []),
                      winner,
                    ])
                  : setRoyalGames(
                      royalGames?.filter((game) => game._id !== winner._id) ||
                        []
                    );
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
