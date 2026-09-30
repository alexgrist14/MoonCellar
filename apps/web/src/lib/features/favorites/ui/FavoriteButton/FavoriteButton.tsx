"use client";

import { CSSProperties, FC, useMemo } from "react";
import { IGameResponse } from "@mooncellar/schemas";
import { useToggleFavoriteMutation } from "@/src/lib/entities/user/api/favorites.mutations";
import { useAuthStore } from "@/src/lib/shared/store/auth.store";
import { GameControlButton } from "@/src/lib/shared/ui/GameControlButton";
import { SvgHeart, SvgHeartFilled } from "@/src/lib/shared/ui/svg";
import { toast } from "@/src/lib/shared/utils/toast.utils";

const ICON_STYLE: CSSProperties = { color: "inherit" };

export const FavoriteButton: FC<{ game: IGameResponse }> = ({ game }) => {
  const profile = useAuthStore((s) => s.profile);
  const { mutate, isPending } = useToggleFavoriteMutation();

  const favorites = useMemo(() => profile?.favorites ?? [], [profile]);
  const isFavorite = favorites.includes(game._id);
  const userId = profile?._id;

  const save = (title: string) => {
    if (!userId) return;

    mutate(
      { userId, gameId: game._id, isFavorite },
      { onSuccess: () => toast.success({ title, description: game.name }) }
    );
  };

  const handleClick = () => {
    if (!userId || isPending) return;

    save(isFavorite ? "Removed from favourites" : "Added to favourites");
  };

  const tooltip = !userId
    ? "You must be logged in to use favourites"
    : isFavorite
      ? "Remove from favourites"
      : "Add to favourites";

  return (
    <GameControlButton
      icon={
        isFavorite ? (
          <SvgHeartFilled size="16" style={ICON_STYLE} />
        ) : (
          <SvgHeart size="16" style={ICON_STYLE} />
        )
      }
      label={isFavorite ? "Remove from favourites" : "Add to favourites"}
      tooltip={tooltip}
      tone="favorite"
      isActive={isFavorite}
      isPressed={isFavorite}
      isDisabled={!userId}
      onClick={handleClick}
    />
  );
};
