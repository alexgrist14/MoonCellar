import { FC, ReactNode, useState } from "react";
import styles from "./GamesCards.module.scss";
import { IGameResponse } from "../../lib/schemas/games.schema";
import { Grid, AutoSizer } from "react-virtualized";
import { GameCard } from "../GameCard";
import { coverRatio } from "../../constants";
import { Scrollbar } from "../Scrollbar";

interface IGamesCardsProps {
  children?: ReactNode;
  games?: IGameResponse[];
  gameClassName?: string;
  additionalHeight?: number;
  additionalGameNode?: (game: IGameResponse) => ReactNode;
}

export const GamesCards: FC<IGamesCardsProps> = ({
  children,
  games,
  gameClassName,
  additionalHeight,
  additionalGameNode,
}) => {
  const [scrollTop, setScrollTop] = useState(0);
  if (!games?.length) return null;

  return (
    <div className={styles.block}>
      <AutoSizer>
        {({ width, height }) => {
          const minWidth = 180;
          let columnCount = 1;
          switch (true) {
            case width > 6 * minWidth:
              columnCount = 6;
              break;
            case width > 5 * minWidth:
              columnCount = 5;
              break;
            case width > 4 * minWidth:
              columnCount = 4;
              break;
            case width > 3 * minWidth:
              columnCount = 3;
              break;
            default:
              columnCount = 2;
          }

          const columnWidth = width / columnCount;
          const rowCount = Math.ceil(games.length / columnCount) || 1;
          const rowHeight = columnWidth / coverRatio + (additionalHeight || 0);

          return (
            <Scrollbar
              type="absolute"
              classNameContainer={styles.block__container}
              classNameContent={styles.block__content}
              classNameScrollbar={styles.block__scrollbar}
              contentStyle={{ maxHeight: height }}
              fadeType="both"
              isWithRadius
              onScroll={({ scrollTop }) => {
                setScrollTop(scrollTop || 0);
              }}
            >
              <Grid
                autoHeight
                width={width}
                height={height}
                columnCount={columnCount}
                rowCount={rowCount}
                rowHeight={rowHeight}
                columnWidth={columnWidth}
                overscanRowCount={1}
                scrollTop={scrollTop}
                className={styles.block__grid}
                cellRenderer={({ key, style, rowIndex, columnIndex }) => {
                  const game = games[rowIndex * columnCount + columnIndex];

                  if (!game) return null;

                  return (
                    <div key={key} className={gameClassName} style={style}>
                      <GameCard game={game} />
                      {additionalGameNode?.(game)}
                    </div>
                  );
                }}
              />
            </Scrollbar>
          );
        }}
      </AutoSizer>
      {children}
    </div>
  );
};
