import { FC, useCallback } from "react";
import styles from "./GamePlaysInfo.module.scss";
import { IPlaythrough } from "@mooncellar/schemas";
import { useCommonStore } from "@/src/lib/shared/store/common.store";
import { commonUtils } from "@/src/lib/shared/utils/common.utils";
import { RichText } from "@/src/lib/shared/ui/RichText";
import { StatusBadge, StatusDetails } from "@/src/lib/shared/ui/StatusBadge";

interface IGamePlaysInfoProps {
  playthroughs: IPlaythrough[];
}

export const GamePlaysInfo: FC<IGamePlaysInfoProps> = ({ playthroughs }) => {
  const { systems } = useCommonStore();

  const getPlatform = useCallback(
    (platformId: string) =>
      systems?.find((platform) => platform._id === platformId),
    [systems]
  );

  return (
    <ul className={styles.plays}>
      {playthroughs.map((play) => (
        <li key={play._id} className={styles.plays__info}>
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
          {!!play.comment && <RichText content={play.comment} tone="primary" />}
        </li>
      ))}
    </ul>
  );
};
