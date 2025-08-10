import { FC, useCallback } from "react";
import styles from "./GamePlaysInfo.module.scss";
import { IPlaythrough } from "@/src/lib/shared/lib/schemas/playthroughs.schema";
import { useCommonStore } from "@/src/lib/shared/store/common.store";
import { commonUtils } from "@/src/lib/shared/utils/common.utils";
import { WrapperTemplate } from "@/src/lib/shared/ui/WrapperTemplate";
import { Separator } from "@/src/lib/shared/ui/Separator";

interface IGamePlaysInfoProps {
  gameName: string;
  playthroughs: IPlaythrough[];
}

export const GamePlaysInfo: FC<IGamePlaysInfoProps> = ({
  playthroughs,
  gameName,
}) => {
  const { systems } = useCommonStore();

  const getPlatform = useCallback(
    (platformId: string) =>
      systems?.find((platform) => platform._id === platformId),
    [systems]
  );

  const isActive = useCallback((play: IPlaythrough) => {
    return (
      !!play.isMastered ||
      play.platformId !== undefined ||
      !!play.date ||
      !!play.time ||
      !!play.comment
    );
  }, []);

  return (
    <WrapperTemplate isWithScrollBar isWithBlur>
      <div className={styles.plays}>
        <h2>{gameName}</h2>
        {playthroughs.map((play) => {
          if (!isActive(play)) return <p key={play._id}>Info not available</p>;

          return (
            <div key={play._id} className={styles.plays__play}>
              <div className={styles.plays__top}>
                -
                {play.platformId !== undefined && (
                  <p>{getPlatform(play.platformId)?.name}</p>
                )}
                {!!play.date && <p>{commonUtils.formatDate(play.date)}</p>}
                {!!play.time && <p>{play.time} hours</p>}
                {!!play.isMastered && <p>Mastered</p>}
              </div>
              {!!play.comment && (
                <>
                  <Separator direction="horizontal" />
                  <div className={styles.plays__bottom}>
                    {<p>{play.comment}</p>}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </WrapperTemplate>
  );
};
