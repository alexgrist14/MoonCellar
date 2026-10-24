import { FC } from "react";
import classNames from "classnames";
import {
  usePortGamesQuery,
  usePortPlayerGamesQuery,
} from "@/src/lib/entities/port-achievement/api";
import { useGridRows } from "@/src/lib/shared/hooks/useGridRows";
import { Button, ButtonColor } from "@/src/lib/shared/ui/Button";
import { EmptyState } from "@/src/lib/shared/ui/EmptyState";
import { SectionTitle } from "@/src/lib/shared/ui/SectionTitle";
import { Skeleton } from "@/src/lib/shared/ui/Skeleton";
import { GameCardSkeleton } from "@/src/lib/widgets/game/GameCard";
import { UserPortCard } from "./UserPortCard";
import { PORT_CARD_STYLE, UserPortGame } from "./UserPortGame";
import styles from "./UserPortAchievements.module.scss";

const PREVIEW_ROWS = 2;

interface IUserPortAchievementsProps {
  userId: string;
  isPreview?: boolean;
  onShowAll?: () => void;
}

// The player's progress in the MoonCellar Team ports (apps/game); the preview hides until they have some
export const UserPortAchievements: FC<IUserPortAchievementsProps> = ({
  userId,
  isPreview,
  onShowAll,
}) => {
  const { data: games = [], isLoading } = usePortPlayerGamesQuery(userId);
  const { data: ports = [] } = usePortGamesQuery(!!games.length);
  const { ref: gridRef, visibleCount } = useGridRows<HTMLUListElement>(
    games.length,
    isPreview ? PREVIEW_ROWS : undefined
  );

  if (isPreview && !games.length) return null;

  const getSiteGame = (game: string) =>
    ports.find((port) => port.slug === game)?.siteGame;

  return (
    <section className={styles.ports} aria-labelledby="profile-port-games">
      <SectionTitle
        as="h3"
        count={games.length || undefined}
        action={
          isPreview && (
            <Button
              color={ButtonColor.TRANSPARENT}
              onClick={onShowAll}
              aria-label="All MoonCellar Team ports"
            >
              All
            </Button>
          )
        }
      >
        <span id="profile-port-games">MoonCellar Team ports</span>
      </SectionTitle>

      {isLoading && (
        <div
          className={classNames(styles.game, styles.game_withCard)}
          role="status"
          aria-label="Loading"
        >
          <div className={styles.game__card}>
            <GameCardSkeleton style={PORT_CARD_STYLE} />
          </div>
          <div className={styles.game__body}>
            <Skeleton shape="text" width="40%" />
            <Skeleton shape="text" width="100%" />
          </div>
        </div>
      )}

      {!isLoading && !games.length && (
        <EmptyState
          variant="inline"
          title="No achievements in MoonCellar Team ports yet."
        />
      )}

      {isPreview ? (
        <ul ref={gridRef} className={styles.ports__grid}>
          {games.map((summary, index) => (
            <li
              key={summary.game}
              className={classNames(styles.ports__item, {
                [styles.ports__item_hidden]: index >= visibleCount,
              })}
            >
              <UserPortCard
                summary={summary}
                siteGame={getSiteGame(summary.game)}
              />
            </li>
          ))}
        </ul>
      ) : (
        <ul className={styles.ports__list}>
          {games.map((summary) => (
            <li key={summary.game}>
              <UserPortGame
                userId={userId}
                summary={summary}
                siteGame={getSiteGame(summary.game)}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};
