"use client";

import Image from "next/image";
import { FC } from "react";
import Link from "next/link";
import {
  IGameResponse,
  IGenreResponse,
  IUpcomingReleaseGroup,
} from "@mooncellar/schemas";
import styles from "./MainPage.module.scss";
import { ReleaseCalendar } from "@/src/lib/widgets/main/ReleaseCalendar";
import { ReleaseRail } from "@/src/lib/widgets/main/ReleaseRail";
import { useHideAdult } from "@/src/lib/shared/hooks/useHideAdult";
import { isAdultGame } from "@/src/lib/shared/utils/adult.utils";
import { toSlug } from "@/src/lib/shared/utils/slug.utils";
import { IPlatformCount } from "@/src/lib/shared/types/games.type";
import { Box } from "@/src/lib/shared/ui/Box";
import { BGImage } from "@/src/lib/shared/ui/BGImage";
import { SectionTitle } from "@/src/lib/shared/ui/SectionTitle";
import { MAIN_PAGE_DESCRIPTION, MAIN_PAGE_TITLE } from "./MainPage.constants";

interface MainPageProps {
  games: {
    topRated: IGameResponse[];
    genre: IGenreResponse[];
    upcoming: IUpcomingReleaseGroup[];
    recent: IGameResponse[];
  };
  platforms: IPlatformCount[];
  now: number;
}

const formatCount = (count: number) => count.toLocaleString("en-US");

export const MainPage: FC<MainPageProps> = ({ games, platforms, now }) => {
  const hideAdult = useHideAdult();

  const upcomingCount = games.upcoming.reduce(
    (total, group) => total + group.games.length,
    0
  );

  const browseSections = [
    {
      title: "By genre",
      items: games.genre.slice(0, 10).map((item) => ({
        name: item.genre,
        href: `/games/genre/${toSlug(item.genre)}`,
        count: item.count,
      })),
    },
    {
      title: "By platform",
      items: platforms.map((platform) => ({
        name: platform.name,
        href: `/games/platform/${platform.slug}`,
        count: platform.count,
      })),
    },
  ].filter(({ items }) => items.length);

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
        {!!upcomingCount && (
          <Box title="Release calendar" titleCount={upcomingCount}>
            <ReleaseCalendar groups={games.upcoming} now={now} />
          </Box>
        )}
        {!!games.recent.length && (
          <Box title="Out now">
            <ReleaseRail games={games.recent} withDate />
          </Box>
        )}
        {!!browseSections.length && (
          <Box title="Browse the catalogue" classNameContent={styles.browse}>
            {browseSections.map(({ title, items }) => (
              <section className={styles.browse__group} key={title}>
                <h3 className={styles.browse__title}>{title}</h3>
                <ul className={styles.browse__list}>
                  {items.map(({ name, href, count }) => (
                    <li key={href}>
                      <Link href={href} className={styles.browse__row}>
                        <span className={styles.browse__name}>{name}</span>
                        <span className={styles.browse__count}>
                          {formatCount(count)}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </Box>
        )}
      </div>
    </>
  );
};
