import { FC, useMemo, useState } from "react";
import classNames from "classnames";
import { IGameResponse } from "@mooncellar/schemas";
import { useGamesByIdsQuery } from "@/src/lib/entities/game/api/game.queries";
import { useUpdateFavoritesMutation } from "@/src/lib/entities/user/api/favorites.mutations";
import { GameCoverImage } from "@/src/lib/entities/game/ui/GameCoverImage";
import { Button, ButtonColor } from "@/src/lib/shared/ui/Button";
import { GameCard } from "@/src/lib/widgets/game/GameCard";
import { SectionTitle } from "@/src/lib/shared/ui/SectionTitle";
import { SortableEditor } from "@/src/lib/shared/ui/SortableEditor";
import { EmptyState } from "@/src/lib/shared/ui/EmptyState";
import {
  SvgHeart,
  SvgListBullet,
  SvgMore,
  SvgPen,
  SvgPlay,
} from "@/src/lib/shared/ui/svg";
import { toast } from "@/src/lib/shared/utils/toast.utils";
import styles from "./FavoriteGames.module.scss";

const FAVORITE_GAMES_PREVIEW_LIMIT = 10;

interface IFavoriteGamesProps {
  userId: string;
  favoriteIds: string[];
  games: IGameResponse[];
  isOwner: boolean;
  isPreview?: boolean;
  onShowAll?: () => void;
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

export const FavoriteGames: FC<IFavoriteGamesProps> = ({
  userId,
  favoriteIds,
  games: initialGames,
  isOwner,
  isPreview,
  onShowAll,
}) => {
  const [draft, setDraft] = useState<IGameResponse[] | null>(null);
  const { mutate: updateFavorites, isPending } = useUpdateFavoritesMutation();

  const isServerOrder =
    favoriteIds.length === initialGames.length &&
    favoriteIds.every((gameId, index) => initialGames[index]?._id === gameId);

  const { data: liveGames } = useGamesByIdsQuery(
    favoriteIds,
    undefined,
    isOwner && !isServerOrder
  );

  const games = useMemo(() => {
    if (isServerOrder || !isOwner) return initialGames;

    const pool = [...(liveGames ?? []), ...initialGames];

    return favoriteIds.flatMap((gameId) => {
      const game = pool.find((item) => item._id === gameId);

      return game ? [game] : [];
    });
  }, [initialGames, favoriteIds, isOwner, isServerOrder, liveGames]);

  if (!games.length && !isOwner) return null;

  const visible = isPreview
    ? games.slice(0, FAVORITE_GAMES_PREVIEW_LIMIT)
    : games;

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
    <section className={styles.top} aria-labelledby="profile-favorite-games">
      <SectionTitle
        as="h3"
        count={games.length || undefined}
        action={
          isPreview && !!games.length ? (
            <Button color={ButtonColor.TRANSPARENT} onClick={onShowAll}>
              All favourites
            </Button>
          ) : (
            !isPreview &&
            isOwner &&
            !draft &&
            games.length > 1 && (
              <Button
                color={ButtonColor.TRANSPARENT}
                className={styles.edit}
                onClick={() => setDraft(games)}
              >
                <SvgPen style={SMALL_ICON_STYLE} />
                Edit
              </Button>
            )
          )
        }
      >
        <span id="profile-favorite-games">Favourite games</span>
      </SectionTitle>

      {!games.length && isOwner && (
        <EmptyState
          variant="inline"
          icon={
            <SvgHeart size="24" style={{ color: "var(--favorite-color)" }} />
          }
          title="Add favourite games — press the heart on any game card or game page."
          action={
            <span className={styles.bar} aria-hidden="true">
              <span className={styles.bar__button}>
                <SvgPlay size="16" style={{ color: "inherit" }} />
              </span>
              <span
                className={classNames(
                  styles.bar__button,
                  styles.bar__button_on
                )}
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
          }
        />
      )}

      {!!games.length && !draft && (
        <ol className={styles.podium}>
          {visible.map((game, index) => (
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

      {!!draft && (
        <SortableEditor
          items={draft}
          getKey={(game) => game._id}
          getName={(game) => game.name}
          renderCover={(game) => <GameCoverImage game={game} sizes="160px" />}
          onChange={setDraft}
          coverRatio="var(--cover-ratio)"
          className={styles.slots}
          note={`Drag or use the arrows to reorder. The first ${FAVORITE_GAMES_PREVIEW_LIMIT} are shown on your profile.`}
          isBusy={isPending}
          onCancel={() => setDraft(null)}
          onSave={handleSave}
        />
      )}
    </section>
  );
};
