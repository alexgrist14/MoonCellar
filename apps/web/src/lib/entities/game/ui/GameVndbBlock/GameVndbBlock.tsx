import { FC } from "react";
import { InfoBlock } from "@/src/lib/shared/ui/InfoBlock";
import { StatRows } from "@/src/lib/shared/ui/StatRows";
import { getHltbAmount } from "@/src/lib/shared/utils/hltb.utils";
import { IGameResponse } from "@mooncellar/schemas";

interface IGameVndbBlockProps {
  game: IGameResponse;
  isBoxed?: boolean;
}

export const GameVndbBlock: FC<IGameVndbBlockProps> = ({
  game,
  isBoxed = true,
}) => {
  const length = getHltbAmount((game.vndb?.lengthMinutes ?? 0) / 60);

  if (!length) return null;

  return (
    <InfoBlock title="VNDB:" isBoxed={isBoxed}>
      <StatRows
        rows={[{ label: "Average length", value: length.amount, unit: "h" }]}
      />
    </InfoBlock>
  );
};
