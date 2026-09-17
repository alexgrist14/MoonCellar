import { FC, useCallback } from "react";
import styles from "./GamePlaysInfo.module.scss";
import { IPlaythrough } from "@mooncellar/schemas";
import { useCommonStore } from "@/src/lib/shared/store/common.store";
import { commonUtils } from "@/src/lib/shared/utils/common.utils";
import { RowsModal } from "@/src/lib/shared/ui/RowsModal";
import { RichText } from "@/src/lib/shared/ui/RichText";
import { StatusBadge, StatusDetails } from "@/src/lib/shared/ui/StatusBadge";

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
    <RowsModal
      title={gameName}
      rows={playthroughs.map((play) => (
        <div key={play._id} className={styles.plays__info}>
          <div className={styles.plays__meta}>
            <StatusBadge status={play.category} />
            {!!play.isMastered && <StatusBadge status="mastered" />}
            <StatusDetails
              items={[
                play.platformId !== undefined &&
                  getPlatform(play.platformId)?.name,
                !!play.time && `${play.time} h`,
                !!play.date && commonUtils.formatDate(play.date),
              ]}
            />
          </div>
          {!!play.comment && (
            <RichText
              content={play.comment}
              className={styles.plays__comment}
            />
          )}
        </div>
      ))}
    />
  );
};
