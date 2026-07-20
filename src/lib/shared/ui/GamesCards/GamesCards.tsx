import { FC, ReactNode, useCallback, useMemo, useState } from "react";
import styles from "./GamesCards.module.scss";
import { IGameResponse } from "../../lib/schemas/games.schema";
import { Grid, AutoSizer, GridCellProps, Size } from "react-virtualized";
import { GameCard } from "../GameCard";
import { coverRatio } from "../../constants";
import { Scrollbar } from "../Scrollbar";

const MIN_COLUMN_WIDTH = 180;
const MIN_COLUMN_COUNT = 2;
const MAX_COLUMN_COUNT = 6;
const OVERSCAN_ROW_COUNT = 2;

const getColumnCount = (width: number) =>
  Math.min(
    MAX_COLUMN_COUNT,
    Math.max(MIN_COLUMN_COUNT, Math.floor(width / MIN_COLUMN_WIDTH))
  );

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
  const [size, setSize] = useState<Size>({ width: 0, height: 0 });

  const onScroll = useCallback(({ scrollTop }: { scrollTop?: number }) => {
    setScrollTop(scrollTop || 0);
  }, []);

  const { columnCount, columnWidth, rowCount, rowHeight } = useMemo(() => {
    const columnCount = getColumnCount(size.width);
    const columnWidth = size.width / columnCount;
    const rowCount = Math.ceil((games?.length || 0) / columnCount) || 1;
    const rowHeight = columnWidth / coverRatio + (additionalHeight || 0);

    return { columnCount, columnWidth, rowCount, rowHeight };
  }, [size.width, games?.length, additionalHeight]);

  const cellRenderer = useCallback(
    ({ key, style, rowIndex, columnIndex }: GridCellProps) => {
      const game = games?.[rowIndex * columnCount + columnIndex];

      if (!game) return null;

      return (
        <div key={key} className={gameClassName} style={style}>
          <GameCard game={game} />
          {additionalGameNode?.(game)}
        </div>
      );
    },
    [games, gameClassName, additionalGameNode, columnCount]
  );

  if (!games?.length) return null;

  return (
    <div className={styles.block}>
      <AutoSizer onResize={setSize}>
        {() =>
          !size.width || !size.height ? null : (
            <Scrollbar
              type="absolute"
              classNameContainer={styles.block__container}
              classNameContent={styles.block__content}
              classNameScrollbar={styles.block__scrollbar}
              contentStyle={{ maxHeight: size.height }}
              fadeType="both"
              isWithRadius
              onScroll={onScroll}
            >
              <Grid
                autoHeight
                width={size.width}
                height={size.height}
                columnCount={columnCount}
                rowCount={rowCount}
                rowHeight={rowHeight}
                columnWidth={columnWidth}
                overscanRowCount={OVERSCAN_ROW_COUNT}
                scrollTop={scrollTop}
                className={styles.block__grid}
                cellRenderer={cellRenderer}
              />
            </Scrollbar>
          )
        }
      </AutoSizer>
      {children}
    </div>
  );
};
