"use client";

import Image from "next/image";
import { FC } from "react";
import {
  IGameResponse,
  IGenreResponse,
} from "../../shared/lib/schemas/games.schema";
import styles from "./MainPage.module.scss";
import { Button } from "../../shared/ui/Button";
import Link from "next/link";
import { commonUtils } from "../../shared/utils/common.utils";

interface MainPageProps {
  games: { topRated: IGameResponse[]; genre: IGenreResponse[] };
}

export const MainPage: FC<MainPageProps> = ({ games }) => {
  console.log(games.genre);
  return (
    <div className={styles.container}>
      <div className="bg-effects">
        <div className="bg-gradient"></div>
        <div className="grid-overlay"></div>
      </div>
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
                {game.cover ? (
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
      <div className={styles.gauntlet}>
        <h2 className={styles.title__section}>Gauntlet</h2>
        <div className={styles.gauntlet__content}>
          <div className={styles.wheel}>
            <div className={styles.wheel__preview}>
              <div className={styles.wheel__container}>
                <svg className={styles.wheel__svg} viewBox="0 0 200 200">
                  <defs>
                    <linearGradient
                      id="slice1"
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="100%"
                    >
                      <stop offset="0%" stop-color="#1e3a5f" />
                      <stop offset="100%" stop-color="#2d4a6f" />
                    </linearGradient>
                    <linearGradient
                      id="slice2"
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="100%"
                    >
                      <stop offset="0%" stop-color="#234567" />
                      <stop offset="100%" stop-color="#345678" />
                    </linearGradient>
                    <linearGradient
                      id="wheelGlow"
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="100%"
                    >
                      <stop offset="0%" stop-color="var(--accent-purple)" />
                      <stop offset="100%" stop-color="var(--accent-cyan)" />
                    </linearGradient>
                  </defs>
                  <circle
                    cx="100"
                    cy="100"
                    r="98"
                    fill="none"
                    stroke="url(#wheelGlow)"
                    stroke-width="2"
                    opacity="0.5"
                  />
                  <path
                    d="M100,100 L100,2 A98,98 0 0,1 184.5,50 Z"
                    fill="url(#slice1)"
                  />
                  <path
                    d="M100,100 L184.5,50 A98,98 0 0,1 184.5,150 Z"
                    fill="url(#slice2)"
                  />
                  <path
                    d="M100,100 L184.5,150 A98,98 0 0,1 100,198 Z"
                    fill="url(#slice1)"
                  />
                  <path
                    d="M100,100 L100,198 A98,98 0 0,1 15.5,150 Z"
                    fill="url(#slice2)"
                  />
                  <path
                    d="M100,100 L15.5,150 A98,98 0 0,1 15.5,50 Z"
                    fill="url(#slice1)"
                  />
                  <path
                    d="M100,100 L15.5,50 A98,98 0 0,1 100,2 Z"
                    fill="url(#slice2)"
                  />
                  <line
                    x1="100"
                    y1="100"
                    x2="100"
                    y2="2"
                    stroke="rgba(255,255,255,0.1)"
                    stroke-width="1"
                  />
                  <line
                    x1="100"
                    y1="100"
                    x2="184.5"
                    y2="50"
                    stroke="rgba(255,255,255,0.1)"
                    stroke-width="1"
                  />
                  <line
                    x1="100"
                    y1="100"
                    x2="184.5"
                    y2="150"
                    stroke="rgba(255,255,255,0.1)"
                    stroke-width="1"
                  />
                  <line
                    x1="100"
                    y1="100"
                    x2="100"
                    y2="198"
                    stroke="rgba(255,255,255,0.1)"
                    stroke-width="1"
                  />
                  <line
                    x1="100"
                    y1="100"
                    x2="15.5"
                    y2="150"
                    stroke="rgba(255,255,255,0.1)"
                    stroke-width="1"
                  />
                  <line
                    x1="100"
                    y1="100"
                    x2="15.5"
                    y2="50"
                    stroke="rgba(255,255,255,0.1)"
                    stroke-width="1"
                  />
                  <circle
                    cx="100"
                    cy="100"
                    r="28"
                    fill="#0d1117"
                    stroke="#fff"
                    stroke-width="3"
                  />
                  <text
                    x="100"
                    y="105"
                    text-anchor="middle"
                    fill="#fff"
                    font-family="Rajdhani"
                    font-size="14"
                    font-weight="600"
                  >
                    Spin
                  </text>
                </svg>
                <div className={styles.wheel__pointer}>
                  <svg
                    viewBox="0 0 24 24"
                    fill="var(--bg-primary)"
                    stroke="#fff"
                    stroke-width="2"
                  >
                    <polygon points="12,2 22,12 12,8" />
                  </svg>
                </div>
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
