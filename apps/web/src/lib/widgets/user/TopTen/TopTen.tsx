import { FC, useState } from "react";
import classNames from "classnames";
import { FAVORITES_MAX, IGameResponse } from "@mooncellar/schemas";
import { useUpdateFavoritesMutation } from "@/src/lib/entities/user/api/favorites.mutations";
import { GameCoverImage } from "@/src/lib/entities/game/ui/GameCoverImage";
import { Button, ButtonColor } from "@/src/lib/shared/ui/Button";
import { GameCard } from "@/src/lib/widgets/game/GameCard";
import { SectionTitle } from "@/src/lib/shared/ui/SectionTitle";
import { SortableGrid } from "@/src/lib/shared/ui/SortableGrid";
import {
  SvgHeart,
  SvgListBullet,
  SvgMore,
  SvgPen,
  SvgPlay,
} from "@/src/lib/shared/ui/svg";
import { toast } from "@/src/lib/shared/utils/toast.utils";
import styles from "./TopTen.module.scss";

interface ITopTenProps {
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

const PODIUM_CARD_STYLE = {
  width: "100%",
  minWidth: 0,
  maxWidth: "none",
  maxHeight: "none",
  padding: 0,
};

export const TopTen: FC<ITopTenProps> = ({ userId, games, isOwner }) => {
  const [draft, setDraft] = useState<IGameResponse[] | null>(null);
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

  return (
    <section className={styles.top} aria-labelledby="profile-top-ten">
      <div className={styles.head}>
        <SectionTitle as="h3">
          <span id="profile-top-ten">Top 10</span>
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
            Pick up to ten favourite games — press the heart on any game card
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
          <SortableGrid
            items={draft}
            getKey={(game) => game._id}
            getName={(game) => game.name}
            renderCover={(game) => <GameCoverImage game={game} sizes="160px" />}
            onChange={setDraft}
            coverRatio="var(--cover-ratio)"
            emptySlots={FAVORITES_MAX - draft.length}
            className={styles.slots}
          />
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
