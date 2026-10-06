import { FC, useMemo, useState } from "react";
import classNames from "classnames";
import { ISteamAccount } from "@mooncellar/schemas";
import { useGamesByIdsQuery } from "@/src/lib/entities/game/api/game.queries";
import { useGridRows } from "@/src/lib/shared/hooks/useGridRows";
import { GameCard } from "@/src/lib/widgets/game/GameCard";
import { Badge } from "@/src/lib/shared/ui/Badge";
import { Button, ButtonColor } from "@/src/lib/shared/ui/Button";
import { EmptyState } from "@/src/lib/shared/ui/EmptyState";
import { Loader } from "@/src/lib/shared/ui/Loader";
import { Pagination } from "@/src/lib/shared/ui/Pagination";
import { SectionTitle } from "@/src/lib/shared/ui/SectionTitle";
import { commonUtils } from "@/src/lib/shared/utils/common.utils";
import styles from "./UserSteamGames.module.scss";

const PREVIEW_LIMIT = 12;
const PREVIEW_ROWS = 2;
const PAGE_SIZE = 24;

const CARD_STYLE = {
  width: "100%",
  minWidth: 0,
  maxWidth: "none",
  maxHeight: "none",
  padding: 0,
};

interface IUserSteamGamesProps {
  steam?: ISteamAccount | null;
  isPreview?: boolean;
  onShowAll?: () => void;
}

export const UserSteamGames: FC<IUserSteamGamesProps> = ({
  steam,
  isPreview,
  onShowAll,
}) => {
  const entries = useMemo(
    () =>
      (steam?.achievements ?? [])
        .filter(({ gameId }) => !!gameId)
        .sort((a, b) => {
          const isMasteredA = a.unlocked >= a.total;
          const isMasteredB = b.unlocked >= b.total;

          if (isMasteredA !== isMasteredB) return isMasteredA ? -1 : 1;
          if (isMasteredA) {
            return (b.masteredAt ?? "").localeCompare(a.masteredAt ?? "");
          }

          return b.unlocked / b.total - a.unlocked / a.total;
        }),
    [steam]
  );
  const [page, setPage] = useState(1);
  const shown = isPreview
    ? entries.slice(0, PREVIEW_LIMIT)
    : entries.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const { data: games = [], isLoading } = useGamesByIdsQuery(
    shown.map(({ gameId }) => gameId!),
    undefined,
    shown.length > 0
  );
  const gameById = useMemo(
    () => new Map(games.map((game) => [game._id, game])),
    [games]
  );
  const items = shown.flatMap((entry) => {
    const game = gameById.get(entry.gameId!);

    return game ? [{ ...entry, game }] : [];
  });
  const masteredCount = entries.filter(
    ({ unlocked, total }) => unlocked >= total
  ).length;
  const { ref: gridRef, visibleCount } = useGridRows<HTMLUListElement>(
    items.length,
    isPreview ? PREVIEW_ROWS : undefined
  );

  if (isPreview && !entries.length) return null;

  return (
    <section className={styles.steam} aria-labelledby="profile-steam-games">
      <SectionTitle
        as="h3"
        count={entries.length || undefined}
        action={
          isPreview && (
            <Button
              color={ButtonColor.TRANSPARENT}
              onClick={onShowAll}
              aria-label="All Steam games"
            >
              All
            </Button>
          )
        }
      >
        <span id="profile-steam-games">Steam</span>
      </SectionTitle>

      {!isPreview && !!steam && (
        <p className={styles.steam__note}>
          {masteredCount
            ? `${masteredCount} mastered ${commonUtils.addLastS("game", masteredCount)}. `
            : ""}
          Achievement progress of the{" "}
          <a
            href={`https://steamcommunity.com/profiles/${steam.steamId}`}
            target="_blank"
            rel="noreferrer"
          >
            Steam profile
          </a>
          {steam.achievementsSyncedAt
            ? `, updated ${commonUtils.getHumanDate(steam.achievementsSyncedAt)}.`
            : "."}
        </p>
      )}

      {isLoading && <Loader type="pulse" />}

      {!isLoading && !items.length && (
        <EmptyState
          variant="inline"
          title={
            steam
              ? "No Steam achievements for games in the catalogue yet."
              : "No Steam account is linked."
          }
        />
      )}

      {!!items.length && (
        <ul
          ref={gridRef}
          className={isPreview ? styles.steam__preview : styles.steam__grid}
        >
          {items.map(({ game, unlocked, total, masteredAt }, index) => {
            const isMastered = unlocked >= total;

            return (
              <li
                key={game._id}
                className={classNames(styles.steam__item, {
                  [styles.steam__item_hidden]: index >= visibleCount,
                })}
              >
                <GameCard game={game} style={CARD_STYLE} />
                <div className={styles.steam__caption}>
                  <Badge tone={isMastered ? "attention" : "neutral"}>
                    {isMastered ? "Mastered" : `${unlocked} / ${total}`}
                  </Badge>
                  <span className={styles.steam__date}>
                    {isMastered && masteredAt
                      ? commonUtils.formatDate(masteredAt)
                      : `${Math.round((unlocked / total) * 100)}%`}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {!isPreview && (
        <Pagination
          take={PAGE_SIZE}
          total={entries.length}
          page={page}
          onPageChange={setPage}
          isFixed
        />
      )}
    </section>
  );
};
