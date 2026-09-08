import { FC, useMemo } from "react";
import classNames from "classnames";
import styles from "./GameRatingsBlock.module.scss";
import { Box } from "@/src/lib/shared/ui/Box";
import { IGameResponse } from "@/src/lib/shared/lib/schemas/games.schema";
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

  const content = (
    <div className={styles.ratings}>
      <h4>Ratings:</h4>
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
  );

  if (!isBoxed) return content;

  return <Box contentStyle={{ padding: "var(--padding-x3)" }}>{content}</Box>;
};
