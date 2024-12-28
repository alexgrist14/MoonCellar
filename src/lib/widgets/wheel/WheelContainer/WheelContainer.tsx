import { FC, useEffect, useState } from "react";
import styles from "./WheelContainer.module.scss";
import { WheelComponent } from "@/src/lib/features/wheel";
import { useStatesStore } from "@/src/lib/shared/store/states.store";
import { GameCard } from "@/src/lib/shared/ui/GameCard";
import { useGamesStore } from "@/src/lib/shared/store/games.store";

export const WheelContainer: FC = () => {
  const { winner, games } = useGamesStore();
  const { isFinished, isLoading } = useStatesStore();

  const [colors, setColors] = useState<string[]>([]);

  useEffect(() => {
    const generateRandomColors = (hue: number): string[] => {
      return (
        games?.map((_, i) => {
          const min = 10;
          const percent =
            i < games.length / 2
              ? (70 / games.length) * i
              : (70 / games.length) * (games.length - i + 1);

          const lightness = (percent > min ? percent : min) + "%";
          const saturation = "60%";

          return `hsl(${hue}, ${saturation}, ${lightness})`;
        }) || []
      );
    };

    setColors(generateRandomColors((200 + Math.random() * 20) ^ 0));
  }, [games, isLoading]);

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
        </div>
      )}
    </div>
  );
};
