"use client";

import { FC, RefObject, useState } from "react";
import Image from "next/image";
import classNames from "classnames";
import { IGameResponse } from "@mooncellar/schemas";
import { useGamesByIdsQuery } from "@/src/lib/entities/game/api/game.queries";
import { useUpdateFavoritesMutation } from "@/src/lib/entities/user/api/favorites.mutations";
import { Button, ButtonColor } from "@/src/lib/shared/ui/Button";
import { Cover } from "@/src/lib/shared/ui/Cover";
import { Popover } from "@/src/lib/shared/ui/Popover";
import { toast } from "@/src/lib/shared/utils/toast.utils";
import styles from "./FavoritesFullPopover.module.scss";

interface IFavoritesFullPopoverProps {
  game: IGameResponse;
  userId: string;
  favorites: string[];
  anchorRef: RefObject<HTMLButtonElement | null>;
  onClose: () => void;
}

export const FavoritesFullPopover: FC<IFavoritesFullPopoverProps> = ({
  game,
  userId,
  favorites,
  anchorRef,
  onClose,
}) => {
  const [selected, setSelected] = useState<number>();
  const { data: games = [], isLoading } = useGamesByIdsQuery(favorites);
  const { mutate, isPending } = useUpdateFavoritesMutation();

  const selectedGame =
    selected !== undefined
      ? games.find((item) => item._id === favorites[selected])
      : undefined;

  const replace = () => {
    if (selected === undefined) return;

    mutate(
      {
        userId,
        gameIds: favorites.map((id, i) => (i === selected ? game._id : id)),
      },
      {
        onSuccess: () => {
          toast.success({
            title: "Replaced in your top 5",
            description: selectedGame
              ? `${game.name} took ${selectedGame.name}'s place`
              : game.name,
          });
          onClose();
        },
      }
    );
  };

  return (
    <Popover
      anchorRef={anchorRef}
      isOpen
      onClose={onClose}
      title="Your top 5 is full"
      contentStyle={{ padding: "var(--padding-x3)" }}
    >
      <div className={styles.full} onClick={(event) => event.stopPropagation()}>
        <p className={styles.full__lede}>
          Choose a favourite to swap for <b>{game.name}</b>.
        </p>
        <div
          className={styles.full__grid}
          role="radiogroup"
          aria-label="Favourites"
        >
          {favorites.map((id, i) => {
            const favorite = games.find((item) => item._id === id);

            return (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={selected === i}
                aria-label={favorite?.name ?? `Favourite ${i + 1}`}
                disabled={isLoading || isPending}
                className={classNames(styles.full__item, {
                  [styles.full__item_selected]: selected === i,
                })}
                onClick={() => setSelected(i)}
              >
                <span className={styles.full__cover}>
                  {favorite?.cover ? (
                    <Image
                      src={favorite.cover}
                      alt=""
                      fill
                      sizes="44px"
                      className={styles.full__image}
                    />
                  ) : (
                    <Cover isWithoutText className={styles.full__placeholder} />
                  )}
                </span>
                <span className={styles.full__rank}>{i + 1}</span>
              </button>
            );
          })}
        </div>
        <p className={styles.full__hint}>
          {selectedGame
            ? `${selectedGame.name} leaves the top 5; ${game.name} takes place ${(selected ?? 0) + 1}.`
            : "Nothing changes until you replace one."}
        </p>
        <div className={styles.full__actions}>
          <Button color={ButtonColor.DEFAULT} onClick={onClose}>
            Cancel
          </Button>
          <Button
            color={ButtonColor.ACCENT}
            disabled={selected === undefined || isPending}
            onClick={replace}
          >
            {selectedGame ? `Replace ${selectedGame.name}` : "Replace"}
          </Button>
        </div>
      </div>
    </Popover>
  );
};
