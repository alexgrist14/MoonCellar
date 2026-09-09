import { FC } from "react";
import classNames from "classnames";
import styles from "./WheelContainer.module.scss";
import { useStatesStore } from "@/src/lib/shared/store/states.store";
import { GameCard } from "@/src/lib/shared/ui/GameCard";
import { useCommonStore } from "@/src/lib/shared/store/common.store";
import { ExpandMenu } from "@/src/lib/shared/ui/ExpandMenu";
import { WheelComponent } from "@/src/lib/features/wheel/WheelComponent";
import { WheelOptions } from "@/src/lib/features/wheel/WheelOptions";
import { useWheelStore } from "@/src/lib/shared/store/wheel.store";
import { Box } from "@/src/lib/shared/ui/Box";
import { ExpandableBlock } from "@/src/lib/shared/ui/ExpandableBlock";
import { Slideshow } from "@/src/lib/shared/ui/Slideshow";
import { VideosRow } from "@/src/lib/shared/ui/VideosRow";
import { GameStatsBoxes } from "@/src/lib/entities/game/ui/GameStatsBoxes";
import { useHideAdult } from "@/src/lib/shared/hooks/useHideAdult";
import { isAdultGame } from "@/src/lib/shared/utils/adult.utils";
import { dateRegions } from "@/src/lib/shared/constants";
import { useDelayedUnmount } from "@/src/lib/shared/hooks/useDelayedUnmount";

export const WheelContainer: FC = () => {
  const winner = useWheelStore((state) => state.winner);
  const timer = useCommonStore((state) => state.timer);
  const systems = useCommonStore((state) => state.systems);

  const { isFinished, isLoading, isMobile } = useStatesStore();

  const {
    rendered: shownWinner,
    isExiting,
    onExitEnd,
  } = useDelayedUnmount(winner);

  const hideMedia = useHideAdult() && !!shownWinner && isAdultGame(shownWinner);

  const releaseDate = shownWinner?.first_release
    ? new Date(shownWinner.first_release * 1000).getFullYear()
    : undefined;

  return (
    <>
      <ExpandMenu position="bottom-right" titleOpen="Settings">
        <WheelOptions />
      </ExpandMenu>
      <div className={styles.container}>
        <div
          className={classNames(styles.container__left, {
            [styles.container_cardReveal]: !!shownWinner && !isExiting,
            [styles.container_conceal]: isExiting,
          })}
          onAnimationEnd={onExitEnd}
        >
          {!!shownWinner && (
            <div className={styles.stack}>
              <GameCard game={shownWinner} isInfoDisabled />
            </div>
          )}
        </div>
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
          {!!shownWinner && (
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
              }}
              scrollFadeType="both"
            >
              <div className={styles.info}>
                <h2>{shownWinner.name}</h2>
                <div className={styles.info__row}>
                  {!!releaseDate && (
                    <p>
                      <span>Year: </span>
                      {releaseDate}
                    </p>
                  )}
                  <p>
                    <span>Game type: </span>
                    {shownWinner.type}
                  </p>
                </div>
                <div className={styles.info__row}>
                  {!!shownWinner.platformIds?.length && (
                    <p>
                      <span>Platforms: </span>
                      {shownWinner.platformIds
                        .map(
                          (id) => systems?.find((sys) => sys._id === id)?.name
                        )
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  )}
                  {!!shownWinner.genres?.length && (
                    <p>
                      <span>Genres: </span>
                      {shownWinner.genres.join(", ")}
                    </p>
                  )}
                  {!!shownWinner.modes?.length && (
                    <p>
                      <span>Game modes: </span>
                      {shownWinner.modes.join(", ")}
                    </p>
                  )}
                  {!!shownWinner.themes?.length && (
                    <p>
                      <span>Themes: </span>
                      {shownWinner.themes.join(", ")}
                    </p>
                  )}
                  {!!shownWinner.languages?.length && (
                    <p>
                      <span>Languages: </span>
                      {shownWinner.languages.join(", ")}
                    </p>
                  )}
                </div>
                <GameStatsBoxes game={shownWinner} isBoxed={false} />
                {!!shownWinner.summary && (
                  <div className={styles.info__text}>
                    <h4>Summary:</h4>
                    <ExpandableBlock modalTitle="Summary">
                      <p>{shownWinner.summary}</p>
                    </ExpandableBlock>
                  </div>
                )}
                {!!shownWinner.storyline && (
                  <div className={styles.info__text}>
                    <h4>Storyline:</h4>
                    <ExpandableBlock modalTitle="Storyline">
                      <p>{shownWinner.storyline}</p>
                    </ExpandableBlock>
                  </div>
                )}
                {!hideMedia && !!shownWinner.screenshots?.length && (
                  <div className={styles.info__text}>
                    <h4>Screenshots:</h4>
                    <Slideshow pictures={shownWinner.screenshots} />
                  </div>
                )}
                {!hideMedia && !!shownWinner.videos?.length && (
                  <div className={styles.info__text}>
                    <h4>Videos:</h4>
                    <VideosRow videos={shownWinner.videos} />
                  </div>
                )}
                {!!shownWinner.release_dates?.length && (
                  <div className={styles.info__text}>
                    <h4>Release dates:</h4>
                    {shownWinner.release_dates
                      .sort((a, b) => a.date - b.date)
                      .map((date, i) => {
                        const platform = systems?.find(
                          (sys) => sys._id === date.platformId
                        );

                        return (
                          <p key={date.date + "_" + i}>
                            {date.human}: {platform?.name || "Unknown platform"}
                            {!!dateRegions[+date.region - 1] && (
                              <span> ({dateRegions[+date.region - 1]})</span>
                            )}
                          </p>
                        );
                      })}
                  </div>
                )}
              </div>
            </Box>
          )}
        </div>
      </div>
    </>
  );
};
