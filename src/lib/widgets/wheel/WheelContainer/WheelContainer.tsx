import { FC } from "react";
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

export const WheelContainer: FC = () => {
  const winner = useWheelStore((state) => state.winner);
  const timer = useCommonStore((state) => state.timer);
  const systems = useCommonStore((state) => state.systems);

  const { isFinished, isLoading, isMobile } = useStatesStore();

  const hideMedia = useHideAdult() && !!winner && isAdultGame(winner);

  const releaseDate = winner?.first_release
    ? new Date(winner.first_release * 1000).getFullYear()
    : undefined;

  return (
    <>
      <ExpandMenu position="bottom-right" titleOpen="Settings">
        <WheelOptions />
      </ExpandMenu>
      <div className={styles.container}>
        <div className={styles.container__left}>
          {!!winner && (
            <div className={styles.stack}>
              <GameCard game={winner} isInfoDisabled />
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
        <div className={styles.container__right}>
          {!!winner && (
            <Box
              isWithScrollBar={!isMobile}
              contentStyle={{
                maxHeight: isMobile
                  ? "fit-content"
                  : "var(--page-height-padding)",
              }}
              scrollFadeType="both"
            >
              <div className={styles.info}>
                <h2>{winner.name}</h2>
                <div className={styles.info__row}>
                  {!!releaseDate && (
                    <p>
                      <span>Year: </span>
                      {releaseDate}
                    </p>
                  )}
                  <p>
                    <span>Game type: </span>
                    {winner.type}
                  </p>
                </div>
                <div className={styles.info__row}>
                  {!!winner.platformIds?.length && (
                    <p>
                      <span>Platforms: </span>
                      {winner.platformIds
                        .map(
                          (id) => systems?.find((sys) => sys._id === id)?.name
                        )
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  )}
                  {!!winner.genres?.length && (
                    <p>
                      <span>Genres: </span>
                      {winner.genres.join(", ")}
                    </p>
                  )}
                  {!!winner.modes?.length && (
                    <p>
                      <span>Game modes: </span>
                      {winner.modes.join(", ")}
                    </p>
                  )}
                  {!!winner.themes?.length && (
                    <p>
                      <span>Themes: </span>
                      {winner.themes.join(", ")}
                    </p>
                  )}
                  {!!winner.languages?.length && (
                    <p>
                      <span>Languages: </span>
                      {winner.languages.join(", ")}
                    </p>
                  )}
                </div>
                <GameStatsBoxes game={winner} isBoxed={false} />
                {!!winner.summary && (
                  <div className={styles.info__text}>
                    <h4>Summary:</h4>
                    <ExpandableBlock>
                      <p>{winner.summary}</p>
                    </ExpandableBlock>
                  </div>
                )}
                {!!winner.storyline && (
                  <div className={styles.info__text}>
                    <h4>Storyline:</h4>
                    <ExpandableBlock>
                      <p>{winner.storyline}</p>
                    </ExpandableBlock>
                  </div>
                )}
                {!hideMedia && !!winner.screenshots?.length && (
                  <div className={styles.info__text}>
                    <h4>Screenshots:</h4>
                    <Slideshow pictures={winner.screenshots} />
                  </div>
                )}
                {!hideMedia && !!winner.videos?.length && (
                  <div className={styles.info__text}>
                    <h4>Videos:</h4>
                    <VideosRow videos={winner.videos} />
                  </div>
                )}
                {!!winner.release_dates?.length && (
                  <div className={styles.info__text}>
                    <h4>Release dates:</h4>
                    {winner.release_dates
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
