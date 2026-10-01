"use client";

import Image from "next/image";
import { FC } from "react";
import {
  IGameResponse,
  IGenreResponse,
  IUpcomingReleaseGroup,
} from "@mooncellar/schemas";
import styles from "./MainPage.module.scss";
import Link from "next/link";
import { commonUtils } from "@/src/lib/shared/utils/common.utils";
import { ReleaseRail } from "@/src/lib/widgets/main/ReleaseRail";
import { GauntletWheel } from "@/src/lib/widgets/main/GauntletWheel";
import { useHideAdult } from "@/src/lib/shared/hooks/useHideAdult";
import { isAdultGame } from "@/src/lib/shared/utils/adult.utils";
import { toSlug } from "@/src/lib/shared/utils/slug.utils";
import { IPlatformCount } from "@/src/lib/shared/types/games.type";
import { Box } from "@/src/lib/shared/ui/Box";
import { BGImage } from "@/src/lib/shared/ui/BGImage";
import { SectionTitle } from "@/src/lib/shared/ui/SectionTitle";
import { Button, ButtonColor } from "@/src/lib/shared/ui/Button";
import { MAIN_PAGE_DESCRIPTION, MAIN_PAGE_TITLE } from "./MainPage.constants";

interface MainPageProps {
  games: {
    topRated: IGameResponse[];
    genre: IGenreResponse[];
    upcoming: IUpcomingReleaseGroup[];
    recent: IGameResponse[];
  };
  platforms: IPlatformCount[];
}

export const MainPage: FC<MainPageProps> = ({ games, platforms }) => {
  const hideAdult = useHideAdult();

  const browseSections = [
    {
      title: "Browse By Genre",
      items: games.genre.slice(0, 10).map((item) => ({
        name: item.genre,
        href: `/games/genre/${toSlug(item.genre)}`,
        count: item.count,
      })),
    },
    {
      title: "Browse By Platform",
      items: platforms.map((platform) => ({
        name: platform.name,
        href: `/games/platform/${platform.slug}`,
        count: platform.count,
      })),
    },
  ];

  return (
    <>
      <BGImage />
      <div className={styles.container}>
        <Box classNameContent={styles.banner}>
          <div className={styles.banner__text}>
            <SectionTitle as="h1" variant="display">
              {MAIN_PAGE_TITLE}
            </SectionTitle>
            <p className={styles.text}>{MAIN_PAGE_DESCRIPTION}</p>
          </div>
          <div className={styles.games}>
            <div className={styles.games__stack}>
              {games.topRated.slice(0, 3).map((game) => (
                <div key={game._id} className={styles.game}>
                  {game.cover && !(hideAdult && isAdultGame(game)) ? (
                    <Image
                      className={styles.game__image}
                      src={game.cover}
                      alt={game.name}
                      width={200}
                      height={280}
                      priority
                    />
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </Box>
        {!!games.upcoming?.length && (
          <Box classNameContent={styles.releases}>
            <SectionTitle isWithMarginBottom>Upcoming Releases</SectionTitle>
            <div className={styles.releases__groups}>
              {games.upcoming.map((group) => (
                <div
                  className={styles.releases__group}
                  key={`${group.year}-${group.quarter}`}
                >
                  <h3 className={styles.releases__quarter}>{group.label}</h3>
                  <ReleaseRail games={group.games} withDate />
                </div>
              ))}
            </div>
          </Box>
        )}
        {!!games.recent?.length && (
          <Box classNameContent={styles.releases}>
            <SectionTitle isWithMarginBottom>Recently Released</SectionTitle>
            <ReleaseRail games={games.recent} withDate />
          </Box>
        )}
        <Box classNameContent={styles.gauntlet}>
          <SectionTitle isWithMarginBottom>Gauntlet</SectionTitle>
          <div className={styles.gauntlet__content}>
            <GauntletWheel />
            <div>
              <p className={styles.text}>
                Can&apos;t decide what to play? Let fate choose your next
                adventure from your library. It also supports games from{" "}
                <Link
                  className={styles.link}
                  href={"https://retroachievements.org/"}
                  target="_blank"
                >
                  RetroAchievements
                </Link>{" "}
                <Image
                  className={styles.img}
                  src={
                    "https://static.retroachievements.org/assets/images/ra-icon.webp"
                  }
                  width={76}
                  height={42}
                  alt="RetroAchievements"
                />
              </p>
              <Button
                href="/gauntlet"
                color={ButtonColor.GREEN}
                className={styles.cta}
              >
                Try it now!
              </Button>
            </div>
          </div>
        </Box>
        {browseSections.map(
          ({ title, items }) =>
            !!items.length && (
              <Box classNameContent={styles.browse} key={title}>
                <SectionTitle isWithMarginBottom>{title}</SectionTitle>
                <div className={styles.browse__content}>
                  {items.map(({ name, href, count }) => (
                    <Link
                      href={href}
                      className={styles.browse__card}
                      key={href}
                    >
                      <h4 className={styles.browse__title}>{name}</h4>
                      <div className={styles.browse__count}>
                        {">"} {commonUtils.roundToFirstDigit(count)}
                      </div>
                    </Link>
                  ))}
                </div>
              </Box>
            )
        )}
      </div>
    </>
  );
};
