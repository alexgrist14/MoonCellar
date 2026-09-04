"use client";

import { FC } from "react";
import Link from "next/link";
import styles from "./HubPage.module.scss";
import { Box } from "../../shared/ui/Box";
import { BGImage } from "../../shared/ui/BGImage";
import { Breadcrumbs } from "../../shared/ui/Breadcrumbs";
import { GameCard } from "../../shared/ui/GameCard";
import { GamesCards } from "../../shared/ui/GamesCards";
import { SectionTitle } from "../../shared/ui/SectionTitle";
import { IGameResponse } from "../../shared/lib/schemas/games.schema";

export interface IHubLinkSection {
  label: string;
  items: { name: string; href: string; count?: number; isActive?: boolean }[];
}

interface IHubPageProps {
  title: string;
  intro: string;
  stats: { value: string; label: string }[];
  breadcrumb: { name: string; href: string }[];
  topGames: IGameResponse[];
  topNote: string;
  middleTitle: string;
  middleHint?: string;
  recentGames?: IGameResponse[];
  yearLinks?: { name: string; href: string }[];
  allGames: IGameResponse[];
  allTitle: string;
  total: number;
  moreHref: string;
  linkSections: IHubLinkSection[];
}

const getYear = (game: IGameResponse) =>
  game.first_release
    ? new Date(game.first_release * 1000).getFullYear()
    : undefined;

export const HubPage: FC<IHubPageProps> = ({
  title,
  intro,
  stats,
  breadcrumb,
  topGames,
  topNote,
  middleTitle,
  middleHint,
  recentGames,
  yearLinks,
  allGames,
  allTitle,
  total,
  moreHref,
  linkSections,
}) => {
  const [hero, ...rest] = topGames;

  return (
    <>
      <BGImage game={hero} />
      <div className={styles.hub}>
        <Box contentStyle={{ gap: "var(--gap-x4)" }}>
          <Breadcrumbs items={breadcrumb} />
          <h1 className={styles.hub__title}>{title}</h1>
          <div className={styles.hub__stats}>
            {stats.map(({ value, label }) => (
              <span key={label} className={styles.hub__stat}>
                <b>{value}</b> {label}
              </span>
            ))}
          </div>
          <p className={styles.hub__intro}>{intro}</p>
        </Box>

        {!!hero && (
          <Box contentStyle={{ gap: "var(--gap-x5)" }}>
            <SectionTitle as="h2">Most popular</SectionTitle>
            <div className={styles.hub__top}>
              <div className={styles.hub__feature}>
                <GameCard game={hero} priority isWithCombinedRating />
                <div className={styles.hub__featureInfo}>
                  <span className={styles.hub__featureRank}>01</span>
                  <Link
                    href={`/games/${hero.slug}`}
                    className={styles.hub__featureName}
                  >
                    {hero.name}
                  </Link>
                  <span className={styles.hub__featureMeta}>
                    {getYear(hero)}
                  </span>
                </div>
              </div>
              {rest.map((game, index) => (
                <GameCard
                  key={game._id}
                  game={game}
                  rank={index + 2}
                  priority
                  isWithCombinedRating
                />
              ))}
            </div>
            <p className={styles.hub__note}>{topNote}</p>
          </Box>
        )}

        <Box contentStyle={{ gap: "var(--gap-x5)" }}>
          <SectionTitle as="h2">{middleTitle}</SectionTitle>
          {!!middleHint && <p className={styles.hub__note}>{middleHint}</p>}
          {!!recentGames?.length && (
            <GamesCards
              games={recentGames}
              isWithCombinedRating
              isWithoutScroll
            />
          )}
          {!!yearLinks?.length && (
            <div className={styles.hub__chips}>
              {yearLinks.map(({ name, href }) => (
                <Link key={href} href={href} className={styles.hub__chip}>
                  {name}
                </Link>
              ))}
            </div>
          )}
        </Box>

        <Box contentStyle={{ gap: "var(--gap-x5)", position: "relative" }}>
          <SectionTitle as="h2">{allTitle}</SectionTitle>
          <GamesCards games={allGames} isWithCombinedRating isWithoutScroll />
          <Link href={moreHref} className={styles.hub__more}>
            Show all {total.toLocaleString("en-US")} games
          </Link>
        </Box>

        <Box contentStyle={{ gap: "var(--gap-x5)" }}>
          {linkSections.map(({ label, items }) => (
            <section key={label} className={styles.hub__links}>
              <span className={styles.hub__linksLabel}>{label}</span>
              <div className={styles.hub__chips}>
                {items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={
                      item.isActive
                        ? `${styles.hub__chip} ${styles.hub__chip_active}`
                        : styles.hub__chip
                    }
                  >
                    {item.name}
                    {item.count !== undefined && (
                      <i className={styles.hub__chipCount}>
                        {item.count.toLocaleString("en-US")}
                      </i>
                    )}
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </Box>
      </div>
    </>
  );
};
