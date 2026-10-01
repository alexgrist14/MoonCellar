import { FC, useMemo } from "react";
import classNames from "classnames";
import styles from "./GameRatingsBlock.module.scss";
import { InfoBlock } from "@/src/lib/shared/ui/InfoBlock";
import { IGameResponse } from "@mooncellar/schemas";
import { getGameRatingRows } from "@/src/lib/shared/utils/rating.utils";

interface IGameRatingsBlockProps {
  game: IGameResponse;
  isBoxed?: boolean;
}

export const GameRatingsBlock: FC<IGameRatingsBlockProps> = ({
  game,
  isBoxed = true,
}) => {
  const rows = useMemo(() => getGameRatingRows(game), [game]);

  if (!rows.length) return null;

  return (
    <InfoBlock title="Ratings:" isBoxed={isBoxed}>
      <div className={styles.ratings}>
        {rows.map((row) => (
          <div
            key={row.key}
            className={classNames(
              styles.ratings__row,
              styles[`ratings__row_${row.key}`]
            )}
          >
            <div className={styles.ratings__head}>
              <p>{row.label}</p>
              <p className={styles.ratings__value}>{row.value}</p>
            </div>
            <div className={styles.ratings__track}>
              <span
                className={styles.ratings__bar}
                style={{ width: `${row.rating * 10}%` }}
              />
            </div>
            {!!row.count && (
              <p className={styles.ratings__count}>{row.count} ratings</p>
            )}
          </div>
        ))}
      </div>
    </InfoBlock>
  );
};
