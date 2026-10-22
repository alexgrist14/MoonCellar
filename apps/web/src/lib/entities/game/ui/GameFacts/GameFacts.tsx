import { FC, Fragment, useMemo } from "react";
import Link from "next/link";
import classNames from "classnames";
import { IGameResponse } from "@mooncellar/schemas";
import { Badge, BadgeTone } from "@/src/lib/shared/ui/Badge";
import { Chip } from "@/src/lib/shared/ui/Chip";
import { useCommonStore } from "@/src/lib/shared/store/common.store";
import { toSlug } from "@/src/lib/shared/utils/slug.utils";
import { getGameStatusTone } from "@/src/lib/entities/game/model";
import styles from "./GameFacts.module.scss";

interface IGameFactsProps {
  game: IGameResponse;
  isCenteredOnMobile?: boolean;
  className?: string;
}

export const GameFacts: FC<IGameFactsProps> = ({
  game,
  isCenteredOnMobile,
  className,
}) => {
  const systems = useCommonStore((s) => s.systems);

  const facts = useMemo(() => {
    const items: {
      key: string;
      label: string;
      href: string;
      tone?: BadgeTone;
    }[] = [];

    const releaseYear = game.first_release
      ? new Date(game.first_release * 1000).getFullYear()
      : undefined;

    if (releaseYear) {
      items.push({
        key: `year-${releaseYear}`,
        label: String(releaseYear),
        href: `/games?years[]=${releaseYear}&years[]=${releaseYear}`,
      });
    }

    if (game.type) {
      items.push({
        key: `type-${game.type}`,
        label: game.type,
        href: `/games?selectedGameTypes[]=${game.type}`,
      });
    }

    game.player_perspectives?.forEach((perspective) =>
      items.push({
        key: `perspective-${perspective}`,
        label: perspective,
        href: `/games?selectedPlayerPerspectives[]=${perspective}`,
      })
    );

    if (game.status) {
      items.push({
        key: `status-${game.status}`,
        label: game.status,
        href: `/games?selectedStatus[]=${game.status}`,
        tone: getGameStatusTone(game.status),
      });
    }

    return items;
  }, [game]);

  const lists = useMemo(() => {
    const genres = (game.genres ?? []).map((genre) => ({
      key: `genre-${genre}`,
      label: genre,
      href: `/games/genre/${toSlug(genre)}`,
    }));

    const platforms = (game.platformIds ?? []).flatMap((id) => {
      const platform = systems?.find((sys) => sys._id === id);

      return platform
        ? [
            {
              key: `platform-${id}`,
              label: platform.name,
              href: `/games/platform/${platform.slug}`,
            },
          ]
        : [];
    });

    return [
      { label: genres.length > 1 ? "Genres" : "Genre", chips: genres },
      {
        label: platforms.length > 1 ? "Platforms" : "Platform",
        chips: platforms,
      },
    ].filter((list) => list.chips.length);
  }, [game.genres, game.platformIds, systems]);

  if (!facts.length && !lists.length) return null;

  return (
    <div
      className={classNames(
        styles.facts,
        { [styles.facts_centered]: isCenteredOnMobile },
        className
      )}
    >
      {!!facts.length && (
        <div className={styles.facts__line}>
          {facts.map((fact, index) => (
            <Fragment key={fact.key}>
              {!!index && !fact.tone && (
                <span className={styles.facts__dot} aria-hidden>
                  ·
                </span>
              )}
              <Link href={fact.href} className={styles.facts__link}>
                {fact.tone ? (
                  <Badge tone={fact.tone} isWithDot>
                    {fact.label}
                  </Badge>
                ) : (
                  fact.label
                )}
              </Link>
            </Fragment>
          ))}
        </div>
      )}

      {!!lists.length && (
        <dl className={styles.facts__lists}>
          {lists.map((list) => (
            <div key={list.label} className={styles.facts__list}>
              <dt className={styles.facts__label}>{list.label}</dt>
              <dd className={styles.facts__chips}>
                {list.chips.map((chip) => (
                  <Chip key={chip.key} href={chip.href}>
                    {chip.label}
                  </Chip>
                ))}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
};
