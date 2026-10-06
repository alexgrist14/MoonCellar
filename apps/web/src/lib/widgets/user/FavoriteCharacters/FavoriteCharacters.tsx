"use client";

import { useGridRows } from "@/src/lib/shared/hooks/useGridRows";
import { FC, useState } from "react";
import { ICharacterResponse } from "@mooncellar/schemas";
import { useFavoriteCharactersQuery } from "@/src/lib/entities/user/api/user.queries";
import { useUpdateFavoriteCharactersMutation } from "@/src/lib/entities/user/api/favorites.mutations";
import { CharacterCard } from "@/src/lib/entities/character/ui/CharacterCard";
import { CharacterPortrait } from "@/src/lib/entities/character/ui/CharacterPortrait";
import { CharacterDetails } from "@/src/lib/features/favorites/ui/CharacterDetails";
import { toast } from "@/src/lib/shared/utils/toast.utils";
import { DRAWER_TRIGGER_ATTRIBUTE, drawer } from "@/src/lib/shared/ui/Drawer";
import { Button, ButtonColor } from "@/src/lib/shared/ui/Button";
import { SectionTitle } from "@/src/lib/shared/ui/SectionTitle";
import { SortableEditor } from "@/src/lib/shared/ui/SortableEditor";
import { EmptyState } from "@/src/lib/shared/ui/EmptyState";
import { SvgHeart, SvgPen } from "@/src/lib/shared/ui/svg";
import styles from "./FavoriteCharacters.module.scss";

const FAVORITE_CHARACTERS_PREVIEW_LIMIT = 20;
const PREVIEW_ROWS = 2;

interface IFavoriteCharactersProps {
  userId: string;
  characters: ICharacterResponse[];
  isOwner: boolean;
  isPreview?: boolean;
  onShowAll?: () => void;
}

const TRIGGER_PROPS = { [DRAWER_TRIGGER_ATTRIBUTE]: "" };

const ICON_STYLE = {
  color: "inherit",
  width: "var(--padding-x4)",
  height: "var(--padding-x4)",
  minWidth: "var(--padding-x4)",
  minHeight: "var(--padding-x4)",
};

export const FavoriteCharacters: FC<IFavoriteCharactersProps> = ({
  userId,
  characters: initialCharacters,
  isOwner,
  isPreview,
  onShowAll,
}) => {
  const { data: characters = initialCharacters } = useFavoriteCharactersQuery(
    userId,
    initialCharacters
  );
  const [draft, setDraft] = useState<ICharacterResponse[] | null>(null);
  const { mutate, isPending } = useUpdateFavoriteCharactersMutation();

  const visible = isPreview
    ? characters.slice(0, FAVORITE_CHARACTERS_PREVIEW_LIMIT)
    : characters;
  const { ref: gridRef, visibleCount } = useGridRows<HTMLOListElement>(
    visible.length,
    isPreview ? PREVIEW_ROWS : undefined
  );

  if (!characters.length && !isOwner) return null;

  const handleSave = () => {
    if (!draft) return;

    mutate(
      { userId, characterIds: draft.map((character) => character._id) },
      {
        onSuccess: () => {
          setDraft(null);
          toast.success({ description: "Favourite characters saved" });
        },
      }
    );
  };

  return (
    <section
      className={styles.characters}
      aria-labelledby="profile-favorite-characters"
    >
      <SectionTitle
        as="h3"
        count={characters.length || undefined}
        action={
          isPreview && !!characters.length ? (
            <Button
              color={ButtonColor.TRANSPARENT}
              onClick={onShowAll}
              aria-label="All favourite characters"
            >
              All
            </Button>
          ) : (
            !isPreview &&
            isOwner &&
            !draft &&
            characters.length > 1 && (
              <Button
                color={ButtonColor.GHOST}
                onClick={() => setDraft(characters)}
              >
                <SvgPen style={ICON_STYLE} />
                Edit
              </Button>
            )
          )
        }
      >
        <span id="profile-favorite-characters">Favourite characters</span>
      </SectionTitle>

      {!characters.length && (
        <EmptyState
          variant="inline"
          icon={
            <SvgHeart size="24" style={{ color: "var(--favorite-color)" }} />
          }
          title="No favourite characters yet. Open a character on any game page and add them to favourites."
        />
      )}

      {!!characters.length && !draft && (
        <ol ref={gridRef} className={styles.grid}>
          {visible.map((character, index) => (
            <li key={character._id} hidden={index >= visibleCount}>
              <CharacterCard
                className={styles.card}
                character={character}
                rank={index + 1}
                priority={index < 2}
                onClick={() =>
                  drawer.open(<CharacterDetails character={character} />, {
                    title: "Character",
                  })
                }
                {...TRIGGER_PROPS}
              />
            </li>
          ))}
        </ol>
      )}

      {!!draft && (
        <SortableEditor
          items={draft}
          getKey={(character) => character._id}
          getName={(character) => character.name}
          renderCover={(character) => (
            <CharacterPortrait character={character} sizes="128px" />
          )}
          onChange={setDraft}
          className={styles.slots}
          note="Drag or use the arrows to reorder. Your profile shows the first characters that fit in two rows."
          isBusy={isPending}
          onCancel={() => setDraft(null)}
          onSave={handleSave}
        />
      )}
    </section>
  );
};
