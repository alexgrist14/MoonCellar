"use client";

import { FC, useState } from "react";
import { ICharacterResponse } from "@mooncellar/schemas";
import { Box } from "@/src/lib/shared/ui/Box";
import { Scrollbar } from "@/src/lib/shared/ui/Scrollbar";
import { Spoiler } from "@/src/lib/shared/ui/Spoiler";
import { DRAWER_TRIGGER_ATTRIBUTE, drawer } from "@/src/lib/shared/ui/Drawer";
import { CharacterCard } from "@/src/lib/entities/character/ui/CharacterCard";
import { CharacterDetails } from "@/src/lib/widgets/characters/CharacterDetails";
import styles from "./GameCharacters.module.scss";
import { SpoilerButton } from "@/src/lib/shared/ui/SpoilerButton";

interface IGameCharactersProps {
  characters?: ICharacterResponse[];
  gameId: string;
}

const TRIGGER_PROPS = { [DRAWER_TRIGGER_ATTRIBUTE]: "" };

export const GameCharacters: FC<IGameCharactersProps> = ({
  characters,
  gameId,
}) => {
  const [showSpoilers, setShowSpoilers] = useState(false);

  const filteredCharacters = characters?.filter(
    (char) => showSpoilers || !char.spoilerGameIds?.includes(gameId)
  );

  if (!characters?.length) return null;

  return (
    <Box
      title="Characters"
      titleCount={filteredCharacters?.length}
      isTitleStart
      contentStyle={{ padding: "var(--padding-x4)" }}
    >
      {characters.some((char) => char.spoilerGameIds?.includes(gameId)) && (
        <SpoilerButton
          className={styles.spoiler}
          onClick={() => setShowSpoilers((prev) => !prev)}
        >
          {showSpoilers ? "Hide spoilers" : "Show spoilers"}
        </SpoilerButton>
      )}

      <Scrollbar
        classNameContent={styles.characters__rail}
        isHorizontal
        isWithArrows
      >
        {filteredCharacters?.map((character) => (
          <div className={styles.characters__card} key={character._id}>
            <CharacterCard
              character={character}
              isSpoiler={character.spoilerGameIds?.includes(gameId)}
              onClick={() =>
                drawer.open(<CharacterDetails character={character} />, {
                  title: "Character",
                })
              }
              {...TRIGGER_PROPS}
            />
          </div>
        ))}
      </Scrollbar>
    </Box>
  );
};
