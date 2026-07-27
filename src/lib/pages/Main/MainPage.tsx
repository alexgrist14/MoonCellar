"use client";

import Image from "next/image";
import { FC } from "react";
import {
  IGameResponse,
  IGenreResponse,
  IUpcomingReleaseGroup,
} from "../../shared/lib/schemas/games.schema";
import styles from "./MainPage.module.scss";
import { Button } from "../../shared/ui/Button";
import Link from "next/link";
import { commonUtils } from "../../shared/utils/common.utils";
import { ReleaseRail } from "./ReleaseRail";
import { GauntletWheel } from "./GauntletWheel";
import { useHideAdult } from "../../shared/hooks/useHideAdult";
import { isAdultGame } from "../../shared/utils/adult.utils";
import { Box } from "../../shared/ui/Box";
import { BGImage } from "../../shared/ui/BGImage";
import { SectionTitle } from "../../shared/ui/SectionTitle";
import { MAIN_PAGE_DESCRIPTION, MAIN_PAGE_TITLE } from "./MainPage.constants";

interface MainPageProps {
  games: {
    topRated: IGameResponse[];
    genre: IGenreResponse[];
    upcoming: IUpcomingReleaseGroup[];
    recent: IGameResponse[];
  };
}

export const MainPage: FC<MainPageProps> = ({ games }) => {
  const hideAdult = useHideAdult();

  return (
    <>
      <BGImage />
      <div className={styles.container}>
        <Box classNameContent={styles.banner}>
          <div className={styles.banner__text}>
            <h2 className={styles.title}>{MAIN_PAGE_TITLE}</h2>
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
                  alt="ra"
                />
              </p>
              <Link href={"/gauntlet"}>
                <Button className={styles.btn} color="green">
                  Try it now!
                </Button>
              </Link>
            </div>
          </div>
        </Box>
        <Box classNameContent={styles.genre}>
          <SectionTitle isWithMarginBottom>Browse By Genre</SectionTitle>
          <div className={styles.genre__content}>
            {games.genre.slice(1, 6).map((item) => (
              <div className={styles.genre__card} key={item.genre}>
                <h4 className={styles.genre__title}>{item.genre}</h4>
                <div className={styles.genre__count}>
                  {">"} {commonUtils.roundToFirstDigit(item.count)}
                </div>
              </div>
            ))}
          </div>
        </Box>
      </div>
    </>
  );
};
