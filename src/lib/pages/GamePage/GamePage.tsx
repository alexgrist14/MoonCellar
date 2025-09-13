"use client";

import { FC, useMemo, useState } from "react";
import styles from "./GamePage.module.scss";
import Image from "next/image";
import { dateRegions } from "../../shared/constants";
import { Slideshow } from "../../shared/ui/Slideshow";
import Link from "next/link";
import { Cover } from "../../shared/ui/Cover";
import { GameControls } from "../../shared/ui/GameControls";
import { Loader } from "../../shared/ui/Loader";
import classNames from "classnames";
import { WrapperTemplate } from "../../shared/ui/WrapperTemplate";
import { useAuthStore } from "../../shared/store/auth.store";
import { BGImage } from "../../shared/ui/BGImage";
import { Icon } from "@iconify/react/dist/iconify.js";
import { IGameResponse } from "../../shared/lib/schemas/games.schema";
import { useCommonStore } from "../../shared/store/common.store";

export const GamePage: FC<{ game: IGameResponse }> = ({ game }) => {
  const { isAuth, profile } = useAuthStore();
  const { systems } = useCommonStore();

  const [isLoading, setIsLoading] = useState<boolean>(!!game.cover);

  const { isMastered, isBeaten } = useMemo(() => {
    const mastered = profile?.raAwards?.filter(
      (award) => award.awardType === "Mastery/Completion"
    );
    const beaten = profile?.raAwards?.filter(
      (award) => award.awardType === "Game Beaten"
    );

    return {
      isMastered: mastered?.some((award) =>
        game.retroachievements?.some((item) => item.gameId === award.awardData)
      ),
      isBeaten: beaten?.some((award) =>
        game.retroachievements?.some((item) => item.gameId === award.awardData)
      ),
    };
  }, [game, profile]);

  if (!game) return null;

  const releaseDate = !!game.first_release
    ? new Date(game.first_release * 1000).getFullYear()
    : undefined;

  return (
    <>
      <div className={classNames(styles.page)}>
        <BGImage game={game} />
        <div className={styles.page__left}>
          <WrapperTemplate contentStyle={{ padding: "0", gap: "0" }}>
            <div
              className={classNames(
                styles.page__cover,
                isAuth && styles.page__cover_control
              )}
            >
              {!!game.retroachievements?.length && (
                <div
                  className={classNames(styles.page__ra, {
                    [styles.page__ra_beaten]: isBeaten,
                    [styles.page__ra_mastered]: isMastered,
                  })}
                >
                  <Icon icon={"game-icons:achievement"} />
                </div>
              )}
              {isLoading && <Loader />}
              {!!game.cover ? (
                <Image
                  onLoad={() => setIsLoading(false)}
                  key={game.cover}
                  alt="Cover"
                  src={game.cover}
                  width={700}
                  height={900}
                />
              ) : (
                <Cover />
              )}
            </div>
            <GameControls game={game} />
          </WrapperTemplate>
        </div>
        <WrapperTemplate
          isWithBlur
          classNameContent={styles.page__right}
          contentStyle={{ padding: "10px" }}
        >
          <h2>{game.name}</h2>
          <div className={styles.page__info}>
            {!!game.first_release && (
              <p>
                <span>Year: </span>
                <Link
                  href={`/games?years[]=${releaseDate}&years[]=${releaseDate}`}
                >
                  {releaseDate}
                </Link>
              </p>
            )}
            <p>
              <span>Game type: </span>
              <Link href={`/games?selectedGameTypes[]=${game.type}`}>
                {game.type}
              </Link>
            </p>
          </div>
          {!!game.companies?.length && (
            <div className={styles.page__developers}>
              <p>
                <span>
                  Companies
                  {game.companies.length > 1 ? "s" : ""}:{" "}
                </span>
                {game.companies.map((comp, i, array) => (
                  <span key={comp.name + i}>
                    <Link href={`/games?company=${comp.name}`}>
                      {comp.name}
                    </Link>
                    {i !== array.length - 1 ? ", " : ""}
                  </span>
                ))}
              </p>
            </div>
          )}
          <div className={styles.page__info}>
            {!!game.platformIds?.length && (
              <p>
                <span>Platforms: </span>
                {game.platformIds.map((id, i, array) => {
                  const platform = systems?.find((sys) => sys._id === id);

                  if (!platform) return null;

                  return (
                    <span key={id}>
                      <Link href={`/games?selectedPlatforms[]=${id}`}>
                        {platform.name}
                      </Link>
                      {i !== array.length - 1 ? ", " : ""}
                    </span>
                  );
                })}
              </p>
            )}
            {!!game.genres?.length && (
              <p>
                <span>Genres: </span>
                {game.genres.map((genre, i, array) => (
                  <span key={genre + i}>
                    <Link href={`/games?selectedGenres[]=${genre}`}>
                      {genre}
                    </Link>
                    {i !== array.length - 1 ? ", " : ""}
                  </span>
                ))}
              </p>
            )}
            {!!game.modes?.length && (
              <p>
                <span>Game modes: </span>
                {game.modes.map((mode, i, array) => (
                  <span key={mode + i}>
                    <Link href={`/games?selectedModes[]=${mode}`}>{mode}</Link>
                    {i !== array.length - 1 ? ", " : ""}
                  </span>
                ))}
              </p>
            )}
            {!!game.themes?.length && (
              <p>
                <span>Themes: </span>
                {game.themes.map((theme, i, array) => (
                  <span key={theme + i}>
                    <Link href={`/games?selectedThemes[]=${theme}`}>
                      {theme}
                    </Link>
                    {i !== array.length - 1 ? ", " : ""}
                  </span>
                ))}
              </p>
            )}
          </div>
          {!!game.summary && (
            <div className={styles.page__text}>
              <h4>Summary:</h4>
              <p>{game.summary}</p>
            </div>
          )}
          {!!game.storyline && (
            <div className={styles.page__text}>
              <h4>Storyline:</h4>
              <p>{game.storyline}</p>
            </div>
          )}
          {!!game.screenshots?.length && (
            <div className={styles.page__screenshots}>
              <h4>Screenshots:</h4>
              <Slideshow pictures={game.screenshots} />
            </div>
          )}
          {!!game.artworks?.length && (
            <div className={styles.page__screenshots}>
              <h4>Artworks:</h4>
              <Slideshow pictures={game.artworks} />
            </div>
          )}
          <div className={styles.page__bottom}>
            {!!game.release_dates?.length && (
              <div className={styles.page__links}>
                <h4>Release dates:</h4>
                {game.release_dates.map((date, i) => {
                  const platform = systems?.find(
                    (sys) => sys._id === date.platformId
                  );

                  return (
                    <p key={date.date + "_" + i}>
                      {date.human}: {platform?.name || "Unknown platform"}
                      <span> ({dateRegions[+date.region - 1]})</span>
                    </p>
                  );
                })}
              </div>
            )}
            {!!game.websites?.length && (
              <div className={styles.page__links}>
                <h4>Links:</h4>
                {game.websites.map((link, i) => (
                  <Link target="_blank" key={link + i} href={link}>
                    {link.split("/")[2]}
                  </Link>
                ))}
              </div>
            )}
          </div>
          {!!game.keywords?.length && (
            <div className={styles.page__info}>
              <p>
                <span>Keywords: </span>
                {game.keywords.map((keyword, i, array) => (
                  <span key={keyword + i}>
                    <Link href={`/games?selectedKeywords[]=${keyword}`}>
                      {keyword}
                    </Link>
                    {i !== array.length - 1 ? ", " : ""}
                  </span>
                ))}
              </p>
            </div>
          )}
        </WrapperTemplate>
      </div>
    </>
  );
};
