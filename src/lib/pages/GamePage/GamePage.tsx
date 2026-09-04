"use client";

import { FC } from "react";
import styles from "./GamePage.module.scss";
import { dateRegions } from "../../shared/constants";
import { Slideshow } from "../../shared/ui/Slideshow";
import { VideosRow } from "../../shared/ui/VideosRow";
import Link from "next/link";
import { GameCard } from "../../shared/ui/GameCard";
import classNames from "classnames";
import { Box } from "../../shared/ui/Box";
import { BGImage } from "../../shared/ui/BGImage";
import { Breadcrumbs } from "../../shared/ui/Breadcrumbs";
import { IGameResponse } from "../../shared/lib/schemas/games.schema";
import { useCommonStore } from "../../shared/store/common.store";
import { useHideAdult } from "../../shared/hooks/useHideAdult";
import { isAdultGame } from "../../shared/utils/adult.utils";
import { GameFriendsStatus } from "../../features/game/GameFriendsStatus";
import { GameAdminControls } from "../../features/game/GameAdminControls";
import { ExpandableBlock } from "../../shared/ui/ExpandableBlock";
import { GameStatsBoxes } from "@/src/lib/entities/game/ui/GameStatsBoxes";
import { formatMultiplayerMode } from "../../shared/utils/multiplayer.utils";
import { toSlug } from "../../shared/utils/slug.utils";

export const GamePage: FC<{ game: IGameResponse }> = ({ game }) => {
  const { systems } = useCommonStore();

  const hideMedia = useHideAdult() && isAdultGame(game);

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
          <GameStatsBoxes game={game} />
          <GameFriendsStatus gameId={game._id} />
          <GameAdminControls game={game} />
        </div>
        <Box
          classNameContent={styles.page__right}
          contentStyle={{ padding: "var(--padding-x3)" }}
        >
          <Breadcrumbs
            className={styles.page__crumbs}
            items={[
              { name: "Home", href: "/" },
              { name: "Games", href: "/games" },
              { name: game.name, href: `/games/${game.slug}` },
            ]}
          />
          <div className={styles.page__header}>
            <div className={styles.page__titleGroup}>
              <h1>{game.name}</h1>
              {!!game.alternative_names?.length && (
                <p className={styles.page__altNames}>
                  {game.alternative_names.join(", ")}
                </p>
              )}
            </div>
          </div>
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
            {!!game.status && (
              <p>
                <span>Status: </span>
                <Link href={`/games?selectedStatus[]=${game.status}`}>
                  {game.status}
                </Link>
              </p>
            )}
            {!!game.versionTitle && (
              <p>
                <span>Version: </span>
                {game.versionTitle}
              </p>
            )}
          </div>
          {!!game.companies?.length && (
            <div className={styles.page__developers}>
              <p>
                <span>Companies: </span>
                {game.companies.map((comp, i, array) => (
                  <span key={comp.name + i}>
                    <Link href={`/games?selectedCompanies[]=${comp.name}`}>
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
                      <Link href={`/games/platform/${platform.slug}`}>
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
                    <Link href={`/games/genre/${toSlug(genre)}`}>{genre}</Link>
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
            {!!game.game_engines?.length && (
              <p>
                <span>Game engines: </span>
                {game.game_engines.map((engine, i, array) => (
                  <span key={engine + i}>
                    <Link href={`/games?selectedGameEngines[]=${engine}`}>
                      {engine}
                    </Link>
                    {i !== array.length - 1 ? ", " : ""}
                  </span>
                ))}
              </p>
            )}
            {!!game.player_perspectives?.length && (
              <p>
                <span>Player perspectives: </span>
                {game.player_perspectives.map((perspective, i, array) => (
                  <span key={perspective + i}>
                    <Link
                      href={`/games?selectedPlayerPerspectives[]=${perspective}`}
                    >
                      {perspective}
                    </Link>
                    {i !== array.length - 1 ? ", " : ""}
                  </span>
                ))}
              </p>
            )}
            {!!game.languages?.length && (
              <p>
                <span>Languages: </span>
                {game.languages.map((language, i, array) => (
                  <span key={language + i}>
                    <Link href={`/games?selectedLanguages[]=${language}`}>
                      {language}
                    </Link>
                    {i !== array.length - 1 ? ", " : ""}
                  </span>
                ))}
              </p>
            )}
          </div>
          <div className={styles.page__bottom}>
            {!!game.multiplayer_modes?.length && (
              <div className={styles.page__links}>
                <h4>Multiplayer:</h4>
                {game.multiplayer_modes.map((mode, i) => {
                  const labels = formatMultiplayerMode(mode);

                  if (!labels.length) return null;

                  const platform = systems?.find(
                    (sys) => sys._id === mode.platformId
                  );

                  return (
                    <p key={(mode.platformId || "") + i}>
                      {!!platform && <span>{platform.name}: </span>}
                      {labels.join(", ")}
                    </p>
                  );
                })}
              </div>
            )}
          </div>
          {!!game.summary && (
            <div className={styles.page__text}>
              <h4>Summary:</h4>
              <ExpandableBlock>
                <p>{game.summary}</p>
              </ExpandableBlock>
            </div>
          )}
          {!!game.storyline && (
            <div className={styles.page__text}>
              <h4>Storyline:</h4>
              <ExpandableBlock>
                <p>{game.storyline}</p>
              </ExpandableBlock>
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
            {!!game.ageRatings?.length && (
              <div className={styles.page__links}>
                <h4>Age ratings:</h4>
                {game.ageRatings.map((ageRating, i) => (
                  <p
                    key={ageRating.organization + ageRating.rating + i}
                    title={ageRating.synopsis}
                  >
                    <Link
                      href={`/games?selectedAgeRatings[]=${ageRating.organization}|${ageRating.rating}`}
                    >
                      {ageRating.organization}: {ageRating.rating}
                    </Link>
                  </p>
                ))}
              </div>
            )}
          </div>
          {!!game.keywords?.length && (
            <div className={styles.page__info}>
              <ExpandableBlock>
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
              </ExpandableBlock>
            </div>
          )}
        </Box>
      </div>
    </>
  );
};
