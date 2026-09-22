"use client";

import {
  CSSProperties,
  FC,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";
import { FAVORITES_MAX, IGameResponse } from "@mooncellar/schemas";
import { useUpdateFavoritesMutation } from "@/src/lib/entities/user/api/favorites.mutations";
import { useAuthStore } from "@/src/lib/shared/store/auth.store";
import { GameControlButton } from "@/src/lib/shared/ui/GameControlButton";
import { SvgHeart, SvgHeartFilled } from "@/src/lib/shared/ui/svg";
import { toast } from "@/src/lib/shared/utils/toast.utils";
import { FavoritesFullPopover } from "../FavoritesFullPopover";

const ICON_STYLE: CSSProperties = { color: "inherit" };

export const FavoriteButton: FC<{ game: IGameResponse }> = ({ game }) => {
  const profile = useAuthStore((s) => s.profile);
  const anchorRef = useRef<HTMLButtonElement>(null);
  const [isFullOpen, setIsFullOpen] = useState(false);
  const { mutate, isPending } = useUpdateFavoritesMutation();

  const favorites = useMemo(() => profile?.favorites ?? [], [profile]);
  const isFavorite = favorites.includes(game._id);
  const userId = profile?._id;

  const closeFull = useCallback(() => setIsFullOpen(false), []);

  const save = (gameIds: string[], title: string) => {
    if (!userId) return;

    mutate(
      { userId, gameIds },
      { onSuccess: () => toast.success({ title, description: game.name }) }
    );
  };

  const handleClick = () => {
    if (!userId || isPending) return;

    if (isFavorite) {
      save(
        favorites.filter((id) => id !== game._id),
        "Removed from favourites"
      );
      return;
    }

    if (favorites.length >= FAVORITES_MAX) {
      setIsFullOpen((isOpen) => !isOpen);
      return;
    }

    save([...favorites, game._id], "Added to favourites");
  };

  const tooltip = !userId
    ? "You must be logged in to use favourites"
    : isFullOpen
      ? undefined
      : isFavorite
        ? "Remove from favourites"
        : "Add to favourites";

  return (
    <>
      <GameControlButton
        ref={anchorRef}
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
        isExpanded={isFullOpen || undefined}
        isDisabled={!userId}
        onClick={handleClick}
      />
      {isFullOpen && !!userId && (
        <FavoritesFullPopover
          game={game}
          userId={userId}
          favorites={favorites}
          anchorRef={anchorRef}
          onClose={closeFull}
        />
      )}
    </>
  );
};
