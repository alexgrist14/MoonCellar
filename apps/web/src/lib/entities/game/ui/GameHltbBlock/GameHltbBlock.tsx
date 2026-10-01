import { FC, useMemo } from "react";
import styles from "./GameHltbBlock.module.scss";
import { InfoBlock } from "@/src/lib/shared/ui/InfoBlock";
import { StatTile } from "@/src/lib/shared/ui/StatTile";
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

  return (
    <InfoBlock title="HowLongToBeat:" isBoxed={isBoxed}>
      <div className={styles.tiles}>
        {tiles.map((tile) => (
          <StatTile
            key={tile.label}
            label={tile.label}
            value={tile.amount}
            hint={tile.unit}
            align="center"
            isLabelBelow
            isCompact
          />
        ))}
      </div>
    </InfoBlock>
  );
};
