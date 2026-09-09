import { FC, useMemo } from "react";
import styles from "./GameHltbBlock.module.scss";
import { Box } from "@/src/lib/shared/ui/Box";
import { IGameResponse } from "@mooncellar/schemas";
import { getHltbTiles } from "@/src/lib/shared/utils/hltb.utils";

interface IGameHltbBlockProps {
  game: IGameResponse;
  isBoxed?: boolean;
}

export const GameHltbBlock: FC<IGameHltbBlockProps> = ({
  game,
  isBoxed = true,
}) => {
  const tiles = useMemo(() => getHltbTiles(game), [game]);

  if (!tiles.length) return null;

  const content = (
    <div className={styles.hltb}>
      <h4>HowLongToBeat:</h4>
      <div className={styles.hltb__tiles}>
        {tiles.map((tile) => (
          <div key={tile.label} className={styles.hltb__tile}>
            <p className={styles.hltb__value}>{tile.amount}</p>
            <p className={styles.hltb__unit}>{tile.unit}</p>
            <p className={styles.hltb__label}>{tile.label}</p>
          </div>
        ))}
      </div>
    </div>
  );

  if (!isBoxed) return content;

  return <Box contentStyle={{ padding: "var(--padding-x3)" }}>{content}</Box>;
};
