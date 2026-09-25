"use client";

import { FC, useState } from "react";
import classNames from "classnames";
import { ICharacterResponse } from "@mooncellar/schemas";
import { useFavoriteCharactersQuery } from "@/src/lib/entities/user/api/user.queries";
import { useUpdateFavoriteCharactersMutation } from "@/src/lib/entities/user/api/favorites.mutations";
import { CharacterCard } from "@/src/lib/entities/character/ui/CharacterCard";
import { CharacterPortrait } from "@/src/lib/entities/character/ui/CharacterPortrait";
import { CharacterDetails } from "@/src/lib/features/favorites/ui/CharacterDetails";
import { useDragSort } from "@/src/lib/shared/hooks";
import { moveItem } from "@/src/lib/shared/utils/common.utils";
import { toast } from "@/src/lib/shared/utils/toast.utils";
import { DRAWER_TRIGGER_ATTRIBUTE, drawer } from "@/src/lib/shared/ui/Drawer";
import { Button, ButtonColor } from "@/src/lib/shared/ui/Button";
import { SectionTitle } from "@/src/lib/shared/ui/SectionTitle";
import {
  SvgArrow,
  SvgClose,
  SvgGrip,
  SvgHeart,
  SvgPen,
} from "@/src/lib/shared/ui/svg";
import styles from "./FavoriteCharacters.module.scss";

const FAVORITE_CHARACTERS_PREVIEW_LIMIT = 10;

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
  const { dragIndex, overIndex, getItemProps } = useDragSort(
    draft ?? [],
    setDraft
  );
  const { mutate, isPending } = useUpdateFavoriteCharactersMutation();

  if (!characters.length && !isOwner) return null;

  const visible = isPreview
    ? characters.slice(0, FAVORITE_CHARACTERS_PREVIEW_LIMIT)
    : characters;

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
      <div className={styles.head}>
        <SectionTitle as="h3">
          <span id="profile-favorite-characters">Favourite characters</span>
          {!!characters.length && (
            <span className={styles.count}>{characters.length}</span>
          )}
        </SectionTitle>
        {isPreview && !!characters.length && (
          <Button color={ButtonColor.TRANSPARENT} onClick={onShowAll}>
            All characters
          </Button>
        )}
        {!isPreview && isOwner && !draft && characters.length > 1 && (
          <Button
            color={ButtonColor.TRANSPARENT}
            className={styles.edit}
            onClick={() => setDraft(characters)}
          >
            <SvgPen style={ICON_STYLE} />
            Edit
          </Button>
        )}
      </div>

      {!characters.length && (
        <div className={styles.hint}>
          <SvgHeart size="24" style={{ color: "var(--favorite-color)" }} />
          <p>
            No favourite characters yet. Open a character on any game page and
            add them to favourites.
          </p>
        </div>
      )}

      {!!characters.length && !draft && (
        <ol className={styles.grid}>
          {visible.map((character, index) => (
            <li key={character._id}>
              <CharacterCard
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
        <div className={styles.editor}>
          <ol className={styles.grid}>
            {draft.map((character, index) => (
              <li
                key={character._id}
                className={classNames(styles.slot, {
                  [styles.slot_dragging]: dragIndex === index,
                  [styles.slot_over]: overIndex === index,
                })}
                {...getItemProps(index)}
              >
                <div className={styles.cover}>
                  <CharacterPortrait character={character} sizes="128px" />
                  <span className={styles.grip} aria-hidden="true">
                    <SvgGrip size="12" style={{ color: "inherit" }} />
                  </span>
                </div>
                <div className={styles.slot__bar}>
                  <button
                    type="button"
                    className={classNames(styles.icon, styles.icon_flip)}
                    aria-label={`Move ${character.name} left`}
                    disabled={index === 0}
                    onClick={() => setDraft(moveItem(draft, index, index - 1))}
                  >
                    <SvgArrow style={ICON_STYLE} />
                  </button>
                  <button
                    type="button"
                    className={classNames(styles.icon, styles.icon_danger)}
                    aria-label={`Remove ${character.name}`}
                    onClick={() =>
                      setDraft(
                        draft.filter((item) => item._id !== character._id)
                      )
                    }
                  >
                    <SvgClose size="12" style={{ color: "inherit" }} />
                  </button>
                  <button
                    type="button"
                    className={styles.icon}
                    aria-label={`Move ${character.name} right`}
                    disabled={index === draft.length - 1}
                    onClick={() => setDraft(moveItem(draft, index, index + 1))}
                  >
                    <SvgArrow style={ICON_STYLE} />
                  </button>
                </div>
                <span className={styles.slot__name}>{character.name}</span>
              </li>
            ))}
          </ol>
          <div className={styles.footer}>
            <p className={styles.footer__note}>
              Drag or use the arrows to reorder. The first{" "}
              {FAVORITE_CHARACTERS_PREVIEW_LIMIT} are shown on your profile.
            </p>
            <div className={styles.footer__actions}>
              <Button
                color={ButtonColor.DEFAULT}
                disabled={isPending}
                onClick={() => setDraft(null)}
              >
                Cancel
              </Button>
              <Button
                color={ButtonColor.ACCENT}
                disabled={isPending}
                onClick={handleSave}
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
