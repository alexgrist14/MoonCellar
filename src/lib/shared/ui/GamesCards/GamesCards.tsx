import { FC, ReactNode, useState } from "react";
import styles from "./GamesCards.module.scss";
import { IGameResponse } from "../../lib/schemas/games.schema";
import { Grid, AutoSizer } from "react-virtualized";
import { GameCard } from "../GameCard";
import { coverRatio } from "../../constants";
import { Shadow } from "../Shadow";

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
  const [isShadowActive, setIsShadowActive] = useState(true);

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

          return (
            <Grid
              width={width}
              height={height}
              columnCount={columnCount}
              rowCount={rowCount}
              rowHeight={columnWidth / coverRatio + (additionalHeight || 0)}
              columnWidth={columnWidth}
              overscanRowCount={2}
              className={styles.block__grid}
              onScrollbarPresenceChange={({ vertical }) => {
                setIsShadowActive(vertical);
              }}
              onScroll={({ scrollHeight, clientHeight, scrollTop }) => {
                !!clientHeight &&
                  setIsShadowActive(
                    scrollHeight - 30 > clientHeight + scrollTop
                  );
              }}
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
          );
        }}
      </AutoSizer>
      <Shadow isActive={isShadowActive} />
      {children}
    </div>
  );
};
