import { FC } from "react";
import styles from "./GameVndbBlock.module.scss";
import { InfoBlock } from "@/src/lib/shared/ui/InfoBlock";
import { StatTile } from "@/src/lib/shared/ui/StatTile";
import { IGameResponse } from "@mooncellar/schemas";

interface IGameVndbBlockProps {
  game: IGameResponse;
  isBoxed?: boolean;
}

export const GameVndbBlock: FC<IGameVndbBlockProps> = ({
  game,
  isBoxed = true,
}) => {
  const vndbTime = game.vndb?.lengthMinutes;

  if (!vndbTime) return null;

  return (
    <InfoBlock title="VNDB:" isBoxed={isBoxed}>
      <div className={styles.tiles}>
        <StatTile
          value={`${Math.floor(vndbTime / 60)}h ${vndbTime % 60}m`}
          align="center"
        />
      </div>
    </InfoBlock>
  );
};
