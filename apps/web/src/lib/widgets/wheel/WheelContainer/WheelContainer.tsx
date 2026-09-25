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
import { SvgRandom } from "@/src/lib/shared/ui/svg";
import { SvgCrown } from "@/src/lib/shared/ui/svg/SvgCrown";
import { useDelayedUnmount } from "@/src/lib/shared/hooks/useDelayedUnmount";
import { GauntletWinner } from "./GauntletWinner";

export const WheelContainer: FC = () => {
  const winner = useWheelStore((state) => state.winner);
  const timer = useCommonStore((state) => state.timer);

  const { isFinished, isLoading, isMobile } = useStatesStore();
  const isRoyal = !!useStatesStore((state) => state.isRoyal);

  const {
    rendered: shownWinner,
    isExiting,
    onExitEnd,
  } = useDelayedUnmount(winner);

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
            [styles.container_panelReveal]: !!shownWinner && !isExiting,
            [styles.container_conceal]: isExiting,
          })}
          onAnimationEnd={onExitEnd}
        >
          <Box
            isWithScrollBar={!isMobile}
            wrapperStyle={
              isMobile ? undefined : { minHeight: 0, maxHeight: "100%" }
            }
            templateStyle={
              isMobile ? undefined : { minHeight: 0, maxHeight: "100%" }
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
              <div className={styles.idle} data-royal={isRoyal}>
                {isRoyal ? <SvgCrown /> : <SvgRandom />}
                <p className={styles.idle__title}>
                  {isRoyal
                    ? "Spin to knock out the first game"
                    : "Spin to get a game"}
                </p>
                <p className={styles.idle__text}>
                  {isRoyal
                    ? "Every spin removes one game until only the winner is left."
                    : "Change the filters above first, or spin over everything."}
                </p>
              </div>
            )}
          </Box>
        </div>
      </div>
    </>
  );
};
