import { CSSProperties, FC, ReactNode } from "react";
import classNames from "classnames";
import styles from "./GamesCards.module.scss";
import { IGameResponse } from "@mooncellar/schemas";
import { GameCard } from "../GameCard";
import { Scrollbar } from "../Scrollbar";

const PRIORITY_COUNT = 6;
const COLUMN_TIERS = [2, 3, 4, 5, 6];
const MIN_COLUMNS = 2;

const getSnappedColumns = (limit: number, columns?: number) =>
  COLUMN_TIERS.reduce<Record<string, number>>((vars, tier) => {
    let count = columns ? Math.min(tier, columns) : tier;

    while (count > MIN_COLUMNS && limit % count !== 0) {
      count -= 1;
    }

    return { ...vars, [`--games-columns-${tier}`]: count };
  }, {});

interface IGamesCardsProps {
  children?: ReactNode;
  games?: IGameResponse[];
  gameClassName?: string;
  isWithCombinedRating?: boolean;
  isWithoutScroll?: boolean;
  columns?: number;
  limit?: number;
  additionalGameNode?: (game: IGameResponse) => ReactNode;
}

export const GamesCards: FC<IGamesCardsProps> = ({
  children,
  games,
  gameClassName,
  isWithCombinedRating,
  isWithoutScroll,
  columns,
  limit,
  additionalGameNode,
}) => {
  if (!games?.length) return null;

  const grid = (
    <div
      className={classNames(styles.block__grid, {
        [styles.block__grid_limited]: !!columns && !limit,
        [styles.block__grid_snapped]: !!limit,
      })}
      style={
        limit
          ? (getSnappedColumns(limit, columns) as CSSProperties)
          : columns
            ? ({ "--games-columns": columns } as CSSProperties)
            : undefined
      }
    >
      {games.map((game, index) => (
        <div key={game._id} className={gameClassName}>
          <GameCard
            game={game}
            priority={index < PRIORITY_COUNT}
            isWithCombinedRating={isWithCombinedRating}
          />
          {additionalGameNode?.(game)}
        </div>
      ))}
    </div>
  );

  if (isWithoutScroll) {
    return (
      <div
        className={classNames(styles.block, {
          [styles.block_snapped]: !!limit,
        })}
      >
        {grid}
        {children}
      </div>
    );
  }

  return (
    <div
      className={classNames(styles.block, {
        [styles.block_snapped]: !!limit,
      })}
    >
      <Scrollbar
        type="absolute"
        classNameContainer={styles.block__container}
        classNameContent={styles.block__content}
        classNameScrollbar={styles.block__scrollbar}
        classNameLine={styles.block__line}
        contentStyle={{ maxHeight: "100%" }}
        fadeType="both"
        isWithRadius
      >
        {grid}
      </Scrollbar>
      {children}
    </div>
  );
};
