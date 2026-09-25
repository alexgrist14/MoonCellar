import { FC, useMemo } from "react";
import styles from "./GameVndbBlock.module.scss";
import { Box } from "@/src/lib/shared/ui/Box";
import { IGameResponse } from "@mooncellar/schemas";
import { getHltbTiles } from "@/src/lib/shared/utils/hltb.utils";

interface IGameVndbBlockProps {
  game: IGameResponse;
  isBoxed?: boolean;
}

export const GameVndbBlock: FC<IGameVndbBlockProps> = ({
  game,
  isBoxed = true,
}) => {
  const vndbTime = game.vndb?.lengthMinutes;

  console.log(vndbTime);

  if (!vndbTime) return null;

  const content = (
    <div className={styles.vndb}>
      <h4>VNDB:</h4>
      <div className={styles.vndb__tile}>
        {Math.floor(vndbTime / 60)}h{" "}
        <span className={styles.vndb__minutes}>{vndbTime % 60}m</span>
      </div>
    </div>
  );

  if (!isBoxed) return content;

  return <Box contentStyle={{ padding: "var(--padding-x3)" }}>{content}</Box>;
};
