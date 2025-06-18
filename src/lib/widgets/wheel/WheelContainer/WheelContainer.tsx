import { FC } from "react";
import styles from "./WheelContainer.module.scss";
import { useStatesStore } from "@/src/lib/shared/store/states.store";
import { GameCard } from "@/src/lib/shared/ui/GameCard";
import { useGamesStore } from "@/src/lib/shared/store/games.store";
import { useCommonStore } from "@/src/lib/shared/store/common.store";
import { ExpandMenu } from "@/src/lib/shared/ui/ExpandMenu";
import { WheelComponent } from "@/src/lib/features/wheel/WheelComponent";
import { WheelOptions } from "@/src/lib/features/wheel/WheelOptions";

export const WheelContainer: FC = () => {
  const { winner } = useGamesStore();
  const { isFinished, isLoading, isMobile } = useStatesStore();
  const { timer } = useCommonStore();

  return (
    <>
      {isMobile && (
        <>
          <ExpandMenu position="bottom-left" titleOpen="Settings">
            <WheelOptions />
          </ExpandMenu>
        </>
      )}
      <div className={styles.container}>
        <WheelComponent
          time={timer}
          buttonText={
            isLoading ? "Loading..." : !isFinished ? "Spinning..." : "Spin"
          }
        />
        <div className={styles.container__right}>
          {!isMobile && (
            <div style={{ display: "grid", gap: "20px", width: "100%" }}>
              <WheelOptions isWithBlur />
            </div>
          )}
          {!!winner && (
            <GameCard
              spreadDirection={isMobile ? "height" : "width"}
              className={styles.winner}
              game={winner}
            />
          )}
        </div>
      </div>
    </>
  );
};
