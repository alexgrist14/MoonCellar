import { FC, useState } from "react";
import classNames from "classnames";
import { useGridRows } from "@/src/lib/shared/hooks/useGridRows";
import { IRaGameStatus } from "@mooncellar/schemas";
import { useUserRaGamesQuery } from "@/src/lib/entities/user/api/user.queries";
import { GameCard, GameCardSkeleton } from "@/src/lib/widgets/game/GameCard";
import { Badge, BadgeTone } from "@/src/lib/shared/ui/Badge";
import { Button, ButtonColor } from "@/src/lib/shared/ui/Button";
import { EmptyState } from "@/src/lib/shared/ui/EmptyState";
import { Pagination } from "@/src/lib/shared/ui/Pagination";
import { SectionTitle } from "@/src/lib/shared/ui/SectionTitle";
import { commonUtils } from "@/src/lib/shared/utils/common.utils";
import styles from "./UserRaGames.module.scss";

const PREVIEW_LIMIT = 12;
const PREVIEW_ROWS = 2;
const PAGE_SIZE = 24;

const STATUS_LABELS: Record<IRaGameStatus, { label: string; tone: BadgeTone }> =
  {
    mastered: { label: "Mastered", tone: "attention" },
    completed: { label: "Completed", tone: "attention" },
    beaten: { label: "Beaten", tone: "positive" },
    "beaten-softcore": { label: "Beaten (softcore)", tone: "positive" },
  };

const CARD_STYLE = {
  width: "100%",
  minWidth: 0,
  maxWidth: "none",
  maxHeight: "none",
  padding: 0,
};

interface IUserRaGamesProps {
  userId: string;
  raUsername?: string;
  isPreview?: boolean;
  onShowAll?: () => void;
}

export const UserRaGames: FC<IUserRaGamesProps> = ({
  userId,
  raUsername,
  isPreview,
  onShowAll,
}) => {
  const { data = [], isLoading } = useUserRaGamesQuery(userId, !!raUsername);

  const [page, setPage] = useState(1);
  const items = isPreview
    ? data.slice(0, PREVIEW_LIMIT)
    : data.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const { ref: gridRef, visibleCount } = useGridRows<HTMLUListElement>(
    items.length,
    isPreview ? PREVIEW_ROWS : undefined
  );

  if (isPreview && !data.length) return null;

  return (
    <section className={styles.ra} aria-labelledby="profile-ra-games">
      <SectionTitle
        as="h3"
        count={data.length || undefined}
        action={
          isPreview && (
            <Button
              color={ButtonColor.TRANSPARENT}
              onClick={onShowAll}
              aria-label="All RetroAchievements games"
            >
              All
            </Button>
          )
        }
      >
        <span id="profile-ra-games">RetroAchievements</span>
      </SectionTitle>

      {!isPreview && !!raUsername && (
        <p className={styles.ra__note}>
          Awards of{" "}
          <a
            href={`https://retroachievements.org/user/${raUsername}`}
            target="_blank"
            rel="noreferrer"
          >
            {raUsername}
          </a>{" "}
          for games in the MoonCellar catalogue.
        </p>
      )}

      {isLoading && (
        <ul
          className={isPreview ? styles.ra__preview : styles.ra__grid}
          role="status"
          aria-label="Loading"
        >
          {Array.from({ length: 12 }, (_, index) => (
            <li key={index} className={styles.ra__item}>
              <GameCardSkeleton style={CARD_STYLE} />
            </li>
          ))}
        </ul>
      )}

      {!isLoading && !items.length && (
        <EmptyState
          variant="inline"
          title={
            raUsername
              ? "No mastered or beaten games from RetroAchievements yet."
              : "No RetroAchievements account is connected."
          }
        />
      )}

      {!!items.length && (
        <ul
          ref={gridRef}
          className={isPreview ? styles.ra__preview : styles.ra__grid}
        >
          {items.map(({ game, status, awardedAt }) => (
            <li key={game._id} className={styles.ra__item}>
              <GameCard game={game} style={CARD_STYLE} />
              <div className={styles.ra__caption}>
                <Badge tone={STATUS_LABELS[status].tone}>
                  {STATUS_LABELS[status].label}
                </Badge>
                <span className={styles.ra__date}>
                  {commonUtils.formatDate(awardedAt)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
      {!isPreview && (
        <Pagination
          take={PAGE_SIZE}
          total={data.length}
          page={page}
          onPageChange={setPage}
          isFixed
        />
      )}
    </section>
  );
};
