"use client";

import { FC } from "react";
import { ICharacterResponse } from "@mooncellar/schemas";
import { useToggleFavoriteCharacterMutation } from "@/src/lib/entities/user/api/favorites.mutations";
import { useAuthStore } from "@/src/lib/shared/store/auth.store";
import { Button, ButtonColor } from "@/src/lib/shared/ui/Button";
import { SvgHeart, SvgHeartFilled } from "@/src/lib/shared/ui/svg";
import { toast } from "@/src/lib/shared/utils/toast.utils";
import styles from "./FavoriteCharacterButton.module.scss";

const ICON_STYLE = { color: "var(--favorite-color)" };

export const FavoriteCharacterButton: FC<{
  character: ICharacterResponse;
}> = ({ character }) => {
  const profile = useAuthStore((s) => s.profile);
  const { mutate, isPending } = useToggleFavoriteCharacterMutation();

  const userId = profile?._id;
  const favorites = profile?.favoriteCharacters ?? [];
  const isFavorite = favorites.includes(character._id);

  const handleClick = () => {
    if (!userId || isPending) return;

    mutate(
      { userId, characterId: character._id, isFavorite },
      {
        onSuccess: () =>
          toast.success({
            title: isFavorite
              ? "Removed from favourite characters"
              : "Added to favourite characters",
            description: character.name,
          }),
      }
    );
  };

  return (
    <Button
      className={styles.button}
      color={ButtonColor.DEFAULT}
      disabled={!userId || isPending}
      aria-pressed={isFavorite}
      tooltip={
        userId ? undefined : "You must be logged in to use favourites"
      }
      onClick={handleClick}
    >
      {isFavorite ? (
        <SvgHeartFilled size="16" style={ICON_STYLE} />
      ) : (
        <SvgHeart size="16" style={ICON_STYLE} />
      )}
      {isFavorite ? "In favourites" : "Add to favourites"}
    </Button>
  );
};
