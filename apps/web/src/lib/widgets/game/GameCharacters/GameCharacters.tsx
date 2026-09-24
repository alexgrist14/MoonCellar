"use client";

import { FC } from "react";
import { ICharacterResponse } from "@mooncellar/schemas";
import { Box } from "@/src/lib/shared/ui/Box";
import { Scrollbar } from "@/src/lib/shared/ui/Scrollbar";
import { DRAWER_TRIGGER_ATTRIBUTE, drawer } from "@/src/lib/shared/ui/Drawer";
import { CharacterCard } from "@/src/lib/entities/character/ui/CharacterCard";
import { CharacterDetails } from "@/src/lib/features/favorites/ui/CharacterDetails";
import styles from "./GameCharacters.module.scss";

interface IGameCharactersProps {
  characters?: ICharacterResponse[];
}

const TRIGGER_PROPS = { [DRAWER_TRIGGER_ATTRIBUTE]: "" };

export const GameCharacters: FC<IGameCharactersProps> = ({ characters }) => {
  if (!characters?.length) return null;

  return (
    <Box
      title={`Characters ${characters.length}`}
      isTitleStart
      contentStyle={{ padding: "var(--padding-x4)" }}
    >
      <Scrollbar
        classNameContent={styles.characters__rail}
        isHorizontal
        isWithArrows
      >
        {characters.map((character) => (
          <CharacterCard
            key={character._id}
            character={character}
            className={styles.characters__card}
            onClick={() =>
              drawer.open(<CharacterDetails character={character} />, {
                title: "Character",
              })
            }
            {...TRIGGER_PROPS}
          />
        ))}
      </Scrollbar>
    </Box>
  );
};
