"use client";

import { FC, useMemo } from "react";
import styles from "./GamePage.module.scss";
import { dateRegions } from "../../shared/constants";
import { Slideshow } from "../../shared/ui/Slideshow";
import { VideosRow } from "../../shared/ui/VideosRow";
import Link from "next/link";
import { GameCard } from "../../shared/ui/GameCard";
import classNames from "classnames";
import { Box } from "../../shared/ui/Box";
import { BGImage } from "../../shared/ui/BGImage";
import { IGameResponse } from "../../shared/lib/schemas/games.schema";
import { useCommonStore } from "../../shared/store/common.store";
import { formatHltbHours } from "../../shared/utils/hltb.utils";
import { formatRating } from "../../shared/utils/rating.utils";
import { useHideAdult } from "../../shared/hooks/useHideAdult";
import { isAdultGame } from "../../shared/utils/adult.utils";

export const GamePage: FC<{ game: IGameResponse }> = ({ game }) => {
  const { systems } = useCommonStore();

  const hideMedia = useHideAdult() && isAdultGame(game);

  const hltbRows = useMemo(() => {
    if (!game.hltb) {
      return null;
    }

    const rows = [
      { label: "Main Story", value: formatHltbHours(game.hltb.mainStory) },
      { label: "Main + Extra", value: formatHltbHours(game.hltb.mainExtra) },
      {
        label: "Completionist",
        value: formatHltbHours(game.hltb.completionist),
      },
    ].filter((row) => row.value);

    return rows.length ? rows : null;
  }, [game.hltb]);

  const ratingRows = useMemo(() => {
    const rows = [
      { label: "Users", value: formatRating(game.averageRating) },
      { label: "IGDB", value: formatRating(game.igdb?.total_rating, 100) },
      {
        label: "HowLongToBeat",
        value: formatRating(game.hltb?.reviewScore, 100),
      },
    ].filter((row) => row.value);

    return rows.length ? rows : null;
  }, [game.averageRating, game.igdb, game.hltb]);

  if (!game) return null;

  const releaseDate = !!game.first_release
    ? new Date(game.first_release * 1000).getFullYear()
    : undefined;

  return (
    <>
      <div className={classNames(styles.page)}>
        <BGImage game={game} />
        <div className={styles.page__left}>
          <div className={styles.page__leftTop}>
            <GameCard game={game} isInfoDisabled />
          </div>
          {!!hltbRows && (
            <Box contentStyle={{ padding: "var(--padding-x3)" }}>
              <div className={styles.page__hltb}>
                <h4>HowLongToBeat</h4>
                {hltbRows.map((row) => (
                  <p key={row.label}>
                    <span>{row.label}: </span>
                    {row.value}
                  </p>
                ))}
              </div>
            </Box>
          )}
          {!!ratingRows && (
            <Box contentStyle={{ padding: "var(--padding-x3)" }}>
              <div className={styles.page__hltb}>
                <h4>Ratings</h4>
                {ratingRows.map((row) => (
                  <p key={row.label}>
                    <span>{row.label}: </span>
                    {row.value}
                  </p>
                ))}
              </div>
            </Box>
          )}
        </div>
        <Box
          classNameContent={styles.page__right}
          contentStyle={{ padding: "var(--padding-x3)" }}
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
                <span>Companies: </span>
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
          {!!game.franchises?.length && (
            <div className={styles.page__developers}>
              <p>
                <span>Franchises: </span>
                {game.franchises.map((franchise, i, array) => (
                  <span key={franchise + i}>
                    <Link href={`/games?selectedFranchises[]=${franchise}`}>
                      {franchise}
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
          {!hideMedia && !!game.screenshots?.length && (
            <div className={styles.page__screenshots}>
              <h4>Screenshots:</h4>
              <Slideshow pictures={game.screenshots} />
            </div>
          )}
          {!hideMedia && !!game.artworks?.length && (
            <div className={styles.page__screenshots}>
              <h4>Artworks:</h4>
              <Slideshow pictures={game.artworks} />
            </div>
          )}
          {!hideMedia && !!game.videos?.length && (
            <div className={styles.page__screenshots}>
              <h4>Videos:</h4>
              <VideosRow videos={game.videos} />
            </div>
          )}
          <div className={styles.page__bottom}>
            {!!game.release_dates?.length && (
              <div className={styles.page__links}>
                <h4>Release dates:</h4>
                {game.release_dates
                  .sort((a, b) => a.date - b.date)
                  .map((date, i) => {
                    const platform = systems?.find(
                      (sys) => sys._id === date.platformId
                    );

                    return (
                      <p key={date.date + "_" + i}>
                        {date.human}: {platform?.name || "Unknown platform"}
                        {!!dateRegions[+date.region - 1] && (
                          <span> ({dateRegions[+date.region - 1]})</span>
                        )}
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
        </Box>
      </div>
    </>
  );
};
