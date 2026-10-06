import { FC } from "react";
import classNames from "classnames";
import styles from "./WheelContainer.module.scss";
import { useStatesStore } from "@/src/lib/shared/store/states.store";
import { useCommonStore } from "@/src/lib/shared/store/common.store";
import { ExpandMenu } from "@/src/lib/shared/ui/ExpandMenu";
import { WheelComponent } from "@/src/lib/features/wheel/ui/WheelComponent";
import { WheelOptions } from "@/src/lib/features/wheel/ui/WheelOptions";
import { useWheelStore } from "@/src/lib/shared/store/wheel.store";
import { Box } from "@/src/lib/shared/ui/Box";
import { useDelayedSwap } from "@/src/lib/shared/hooks/useDelayedSwap";
import { GauntletWinner } from "./GauntletWinner";
import { GauntletIntro } from "./GauntletIntro";

export const WheelContainer: FC = () => {
  const winner = useWheelStore((state) => state.winner);
  const timer = useCommonStore((state) => state.timer);

  const { isFinished, isLoading, isMobile } = useStatesStore();
  const isRoyal = !!useStatesStore((state) => state.isRoyal);

  const {
    rendered: shownWinner,
    isExiting,
    onExitEnd,
  } = useDelayedSwap(winner);

  return (
    <>
      <ExpandMenu position="bottom-right" titleOpen="Settings">
        <WheelOptions />
      </ExpandMenu>
      <div className={styles.container}>
        <div className={styles.container__wheel}>
          <WheelComponent
            time={timer}
            buttonText={
              isLoading ? "Loading..." : !isFinished ? "Spinning..." : "Spin"
            }
          />
        </div>
        <div
          className={classNames(styles.container__right, {
            [styles.container_panelReveal]: !isExiting,
            [styles.container_conceal]: isExiting,
          })}
          onAnimationEnd={onExitEnd}
          key={shownWinner ? "winner" : "intro"}
        >
          <Box
            isWithScrollBar={!isMobile}
            wrapperStyle={isMobile ? undefined : { flex: 1, minHeight: 0 }}
            templateStyle={
              isMobile ? undefined : { height: "100%", minHeight: 0 }
            }
            contentStyle={{
              maxHeight: isMobile ? "fit-content" : "100%",
              padding: "var(--padding-x6)",
            }}
            scrollFadeType="both"
          >
            {shownWinner ? (
              <GauntletWinner game={shownWinner} isRoyal={isRoyal} />
            ) : (
              <GauntletIntro isRoyal={isRoyal} />
            )}
          </Box>
        </div>
      </div>
    </>
  );
};
