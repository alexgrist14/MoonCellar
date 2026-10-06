import { FC } from "react";
import { ICharacterResponse } from "@mooncellar/schemas";
import { CharacterProfile } from "@/src/lib/entities/character/ui/CharacterProfile";
import { FavoriteCharacterButton } from "@/src/lib/features/favorites/ui/FavoriteCharacterButton";
import { CharacterGames } from "@/src/lib/widgets/characters/CharacterGames";

export const CharacterDetails: FC<{ character: ICharacterResponse }> = ({
  character,
}) => (
  <CharacterProfile
    character={character}
    action={<FavoriteCharacterButton character={character} />}
    games={<CharacterGames games={character?.gameIds} />}
  />
);
