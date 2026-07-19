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
import { useHideAdult } from "../../shared/hooks/useHideAdult";
import { isAdultGame } from "../../shared/utils/adult.utils";

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
    <div className={styles.container}>
      <div className={styles.banner}>
        <div className={styles.banner__text}>
          <h2 className={styles.title}>Your Gaming Universe Awaits</h2>
          <p className={styles.text}>
            Manage your collection of thousands games across all platforms.
            Track progress, discover new titles, and challenge the Gauntlet.
          </p>
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
      </div>
      {!!games.upcoming?.length && (
        <div className={styles.releases}>
          <h2 className={styles.title__section}>Upcoming Releases</h2>
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
        </div>
      )}
      {!!games.recent?.length && (
        <div className={styles.releases}>
          <h2 className={styles.title__section}>Recently Released</h2>
          <ReleaseRail games={games.recent} withDate />
        </div>
      )}
      <div className={styles.gauntlet}>
        <h2 className={styles.title__section}>Gauntlet</h2>
        <div className={styles.gauntlet__content}>
          <div className={styles.wheel}>
            <div className={styles.wheel__preview}>
              <div className={styles.wheel__container}>
                <svg className={styles.wheel__svg} viewBox="0 0 200 200">
                  <circle
                    cx="100"
                    cy="100"
                    r="98"
                    fill="none"
                    stroke="#374151"
                    strokeWidth="2"
                  />
                  <path
                    d="M100,100 L100,2 A98,98 0 0,1 184.5,50 Z"
                    fill="#242e41"
                  />
                  <path
                    d="M100,100 L184.5,50 A98,98 0 0,1 184.5,150 Z"
                    fill="#2c3340"
                  />
                  <path
                    d="M100,100 L184.5,150 A98,98 0 0,1 100,198 Z"
                    fill="#242e41"
                  />
                  <path
                    d="M100,100 L100,198 A98,98 0 0,1 15.5,150 Z"
                    fill="#2c3340"
                  />
                  <path
                    d="M100,100 L15.5,150 A98,98 0 0,1 15.5,50 Z"
                    fill="#242e41"
                  />
                  <path
                    d="M100,100 L15.5,50 A98,98 0 0,1 100,2 Z"
                    fill="#2c3340"
                  />
                  <line
                    x1="100"
                    y1="100"
                    x2="100"
                    y2="2"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="1"
                  />
                  <line
                    x1="100"
                    y1="100"
                    x2="184.5"
                    y2="50"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="1"
                  />
                  <line
                    x1="100"
                    y1="100"
                    x2="184.5"
                    y2="150"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="1"
                  />
                  <line
                    x1="100"
                    y1="100"
                    x2="100"
                    y2="198"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="1"
                  />
                  <line
                    x1="100"
                    y1="100"
                    x2="15.5"
                    y2="150"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="1"
                  />
                  <line
                    x1="100"
                    y1="100"
                    x2="15.5"
                    y2="50"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="1"
                  />
                  <circle
                    cx="100"
                    cy="100"
                    r="28"
                    fill="#0d1117"
                    stroke="#fff"
                    strokeWidth="3"
                  />
                  <text
                    x="100"
                    y="105"
                    textAnchor="middle"
                    fill="#fff"
                    fontFamily="Rajdhani"
                    fontSize="14"
                    fontWeight="600"
                  >
                    Spin
                  </text>
                </svg>
              </div>
            </div>
          </div>
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
      </div>
      <div className={styles.genre}>
        <h2 className={styles.title__section}>Browse By Genre</h2>
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
      </div>
    </div>
  );
};
