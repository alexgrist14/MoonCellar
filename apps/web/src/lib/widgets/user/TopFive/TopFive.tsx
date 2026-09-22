import { DragEvent, FC, useState } from "react";
import Image from "next/image";
import classNames from "classnames";
import { FAVORITES_MAX, IGameResponse } from "@mooncellar/schemas";
import { useUpdateFavoritesMutation } from "@/src/lib/entities/user/api/favorites.mutations";
import { Button, ButtonColor } from "@/src/lib/shared/ui/Button";
import { Cover } from "@/src/lib/shared/ui/Cover";
import { GameCard } from "@/src/lib/widgets/game/GameCard";
import { SectionTitle } from "@/src/lib/shared/ui/SectionTitle";
import {
  SvgArrow,
  SvgClose,
  SvgGrip,
  SvgHeart,
  SvgListBullet,
  SvgMore,
  SvgPen,
  SvgPlay,
} from "@/src/lib/shared/ui/svg";
import { toast } from "@/src/lib/shared/utils/toast.utils";
import styles from "./TopFive.module.scss";

interface ITopFiveProps {
  userId: string;
  games: IGameResponse[];
  isOwner: boolean;
}

const SMALL_ICON_STYLE = {
  color: "inherit",
  width: "var(--padding-x4)",
  height: "var(--padding-x4)",
  minWidth: "var(--padding-x4)",
  minHeight: "var(--padding-x4)",
};

const ARROW_ICON_STYLE = {
  ...SMALL_ICON_STYLE,
  width: "var(--padding-x5)",
  height: "var(--padding-x5)",
  minWidth: "var(--padding-x5)",
  minHeight: "var(--padding-x5)",
};

const PODIUM_CARD_STYLE = {
  width: "100%",
  minWidth: 0,
  maxWidth: "none",
  maxHeight: "none",
  padding: 0,
};

const GameCover: FC<{ game: IGameResponse; sizes: string }> = ({
  game,
  sizes,
}) =>
  game.cover ? (
    <Image
      src={game.cover}
      alt=""
      fill
      sizes={sizes}
      className={styles.image}
    />
  ) : (
    <Cover isWithoutText className={styles.image} />
  );

const move = <T,>(items: T[], from: number, to: number) => {
  if (to < 0 || to >= items.length || from === to) return items;

  const next = [...items];
  const [item] = next.splice(from, 1);

  next.splice(to, 0, item);

  return next;
};

export const TopFive: FC<ITopFiveProps> = ({ userId, games, isOwner }) => {
  const [draft, setDraft] = useState<IGameResponse[] | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const { mutate: updateFavorites, isPending } = useUpdateFavoritesMutation();

  const isEditing = !!draft;

  if (!games.length && !isOwner) return null;

  const handleSave = () => {
    if (!draft) return;

    updateFavorites(
      { userId, gameIds: draft.map((game) => game._id) },
      {
        onSuccess: () => {
          setDraft(null);
          toast.success({ description: "Favourites saved" });
        },
      }
    );
  };

  const handleDrop = (event: DragEvent<HTMLLIElement>, index: number) => {
    event.preventDefault();

    if (dragIndex === null || !draft) return;

    setDraft(move(draft, dragIndex, index));
    setDragIndex(null);
  };

  return (
    <section className={styles.top} aria-labelledby="profile-top-five">
      <div className={styles.head}>
        <SectionTitle as="h3">
          <span id="profile-top-five">Top 5</span>
          {isEditing && (
            <span className={styles.count}>
              {draft.length} / {FAVORITES_MAX}
            </span>
          )}
        </SectionTitle>
        {isOwner && !isEditing && !!games.length && (
          <Button
            color={ButtonColor.TRANSPARENT}
            className={styles.edit}
            onClick={() => setDraft(games)}
          >
            <SvgPen style={SMALL_ICON_STYLE} />
            Edit
          </Button>
        )}
      </div>

      {!games.length && isOwner && (
        <div className={styles.hint}>
          <SvgHeart
            size="24"
            className={styles.hint__heart}
            style={{ color: "var(--favorite-color)" }}
          />
          <p className={styles.hint__text}>
            Pick up to five favourite games — press the heart on any game card
            or game page.
          </p>
          <span className={styles.bar} aria-hidden="true">
            <span className={styles.bar__button}>
              <SvgPlay size="16" style={{ color: "inherit" }} />
            </span>
            <span
              className={classNames(styles.bar__button, styles.bar__button_on)}
            >
              <SvgHeart size="16" style={{ color: "inherit" }} />
            </span>
            <span className={styles.bar__button}>
              <SvgListBullet size="16" style={{ color: "inherit" }} />
            </span>
            <span className={styles.bar__button}>
              <SvgMore size="16" style={{ color: "inherit" }} />
            </span>
          </span>
        </div>
      )}

      {!!games.length && !isEditing && (
        <ol className={styles.podium}>
          {games.map((game, index) => (
            <li key={game._id} className={styles.item}>
              <GameCard
                game={game}
                rank={index + 1}
                priority={index === 0}
                style={PODIUM_CARD_STYLE}
              />
            </li>
          ))}
        </ol>
      )}

      {isEditing && (
        <div className={styles.editor}>
          <ol className={styles.slots}>
            {draft.map((game, index) => (
              <li
                key={game._id}
                className={classNames(styles.slot, {
                  [styles.slot_dragging]: dragIndex === index,
                })}
                draggable
                onDragStart={() => setDragIndex(index)}
                onDragEnd={() => setDragIndex(null)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => handleDrop(event, index)}
              >
                <span className={styles.cover}>
                  <GameCover game={game} sizes="160px" />
                  <span className={styles.grip} aria-hidden="true">
                    <SvgGrip size="12" style={{ color: "inherit" }} />
                  </span>
                </span>
                <span className={styles.slot__bar}>
                  <button
                    type="button"
                    className={classNames(styles.icon, styles.icon_flip)}
                    aria-label={`Move ${game.name} left`}
                    disabled={index === 0}
                    onClick={() => setDraft(move(draft, index, index - 1))}
                  >
                    <SvgArrow style={ARROW_ICON_STYLE} />
                  </button>
                  <button
                    type="button"
                    className={classNames(styles.icon, styles.icon_danger)}
                    aria-label={`Remove ${game.name}`}
                    onClick={() =>
                      setDraft(draft.filter((item) => item._id !== game._id))
                    }
                  >
                    <SvgClose size="12" style={{ color: "inherit" }} />
                  </button>
                  <button
                    type="button"
                    className={styles.icon}
                    aria-label={`Move ${game.name} right`}
                    disabled={index === draft.length - 1}
                    onClick={() => setDraft(move(draft, index, index + 1))}
                  >
                    <SvgArrow style={ARROW_ICON_STYLE} />
                  </button>
                </span>
                <span className={styles.name} title={game.name}>
                  {game.name}
                </span>
              </li>
            ))}
            {Array.from({ length: FAVORITES_MAX - draft.length }, (_, i) => (
              <li
                key={`empty-${i}`}
                className={classNames(styles.slot, styles.slot_empty)}
              >
                <span className={styles.cover}>
                  <span className={styles.empty}>Empty slot</span>
                </span>
              </li>
            ))}
          </ol>
          <div className={styles.footer}>
            <p className={styles.footer__note}>
              Drag or use the arrows to reorder. Add games with the heart on any
              game card.
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
