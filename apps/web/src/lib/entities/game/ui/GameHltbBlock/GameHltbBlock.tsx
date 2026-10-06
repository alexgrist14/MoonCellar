import { FC, useMemo } from "react";
import { InfoBlock } from "@/src/lib/shared/ui/InfoBlock";
import { StatRows } from "@/src/lib/shared/ui/StatRows";
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
      <StatRows
        rows={tiles.map(({ label, amount }) => ({
          label,
          value: amount,
          unit: "h",
        }))}
      />
    </InfoBlock>
  );
};
