import { FC } from "react";
import { IGameResponse } from "@mooncellar/schemas";
import { GameHltbBlock } from "../GameHltbBlock";
import { GameRatingsBlock } from "../GameRatingsBlock";
import { GameExternalPages } from "../GameExternalPages";

interface IGameStatsBoxesProps {
  game: IGameResponse;
  isBoxed?: boolean;
}

export const GameStatsBoxes: FC<IGameStatsBoxesProps> = ({
  game,
  isBoxed = true,
}) => (
  <>
    <GameHltbBlock game={game} isBoxed={isBoxed} />
    <GameRatingsBlock game={game} isBoxed={isBoxed} />
    <GameExternalPages game={game} isBoxed={isBoxed} />
  </>
);
