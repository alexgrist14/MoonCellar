import { FC } from "react";
import { ICharacterResponse } from "@mooncellar/schemas";
import { CharacterProfile } from "@/src/lib/entities/character/ui/CharacterProfile";
import { FavoriteCharacterButton } from "../FavoriteCharacterButton";

export const CharacterDetails: FC<{ character: ICharacterResponse }> = ({
  character,
}) => (
  <CharacterProfile
    character={character}
    action={<FavoriteCharacterButton character={character} />}
  />
);
