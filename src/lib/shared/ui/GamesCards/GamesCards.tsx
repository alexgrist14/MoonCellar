import { CSSProperties, FC, ReactNode } from "react";
import classNames from "classnames";
import styles from "./GamesCards.module.scss";
import { IGameResponse } from "../../lib/schemas/games.schema";
import { GameCard } from "../GameCard";
import { Scrollbar } from "../Scrollbar";

const PRIORITY_COUNT = 6;

interface IGamesCardsProps {
  children?: ReactNode;
  games?: IGameResponse[];
  gameClassName?: string;
  isWithCombinedRating?: boolean;
  isWithoutScroll?: boolean;
  columns?: number;
  additionalGameNode?: (game: IGameResponse) => ReactNode;
}

export const GamesCards: FC<IGamesCardsProps> = ({
  children,
  games,
  gameClassName,
  isWithCombinedRating,
  isWithoutScroll,
  columns,
  additionalGameNode,
}) => {
  if (!games?.length) return null;

  const grid = (
    <div
      className={classNames(styles.block__grid, {
        [styles.block__grid_limited]: !!columns,
      })}
      style={
        columns ? ({ "--games-columns": columns } as CSSProperties) : undefined
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
      <div className={styles.block}>
        {grid}
        {children}
      </div>
    );
  }

  return (
    <div className={styles.block}>
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
