import { FC, Fragment, useCallback } from "react";
import styles from "./GamePlaysInfo.module.scss";
import { IPlaythrough } from "@/src/lib/shared/lib/schemas/playthroughs.schema";
import { useCommonStore } from "@/src/lib/shared/store/common.store";
import { commonUtils } from "@/src/lib/shared/utils/common.utils";
import { Box } from "@/src/lib/shared/ui/Box";

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

  return (
    <Box
      title={gameName}
      isWithScrollBar
      contentStyle={{ padding: "var(--padding-x4)" }}
      classNameContent={styles.plays}
    >
      {playthroughs.map((play) => {
        const segments = [
          commonUtils.upFL(play.category),
          !!play.date && commonUtils.formatDate(play.date),
          play.platformId !== undefined
            ? getPlatform(play.platformId)?.name
            : undefined,
          !!play.time && `${play.time} hours`,
          !!play.isMastered && "Mastered",
        ].filter((segment): segment is string => !!segment);

        return (
          <div key={play._id} className={styles.plays__play}>
            <div className={styles.plays__meta}>
              {segments.map((segment, i) => (
                <Fragment key={i}>
                  {i > 0 && <span className={styles.plays__dot} />}
                  <span>{segment}</span>
                </Fragment>
              ))}
            </div>
            {!!play.comment && (
              <p className={styles.plays__comment}>{play.comment}</p>
            )}
          </div>
        );
      })}
    </Box>
  );
};
