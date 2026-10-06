import { FC } from "react";
import { useGamesByIdsQuery } from "@/src/lib/entities/game/api/game.queries";
import { GamesCards } from "@/src/lib/widgets/game";

interface CharacterGamesProps {
  games?: string[];
}

export const CharacterGames: FC<CharacterGamesProps> = ({ games }) => {
  const { data } = useGamesByIdsQuery(games ?? []);

  return <GamesCards games={data} />;
};
