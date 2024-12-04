import { FC, useEffect, useState } from "react";
import styles from "./GamePage.module.scss";
import Image from "next/image";
import { IGDBGame } from "../../shared/types/igdb";
import { useRouter } from "next/router";
import { IGDBApi } from "../../shared/api";
import { axiosUtils } from "../../shared/utils/axios";
import {
  dateRegions,
  gameCategories,
  gameCategoryNames,
  getImageLink,
} from "../../shared/constants";
import { Slideshow } from "../../shared/ui/Slideshow";
import { ExpandMenu } from "../../shared/ui/ExpandMenu";
import Link from "next/link";
import { Cover } from "../../shared/ui/Cover";
import { GameControls } from "../../shared/ui/GameControls";
import { Loader } from "../../shared/ui/Loader";
import { useGamesFiltersStore } from "../../shared/store/filters.store";
import { ButtonGroup } from "../../shared/ui/Button/ButtonGroup";
import { useGamesStore } from "../../shared/store/games.store";

export const GamePage: FC = () => {
  const { query, isReady } = useRouter();

  const { royalGames, addRoyalGame, removeRoyalGame } = useGamesStore();

  const {
    setSelectedYears,
    setSelectedCategories,
    setSelectedGenres,
    setSearchCompany,
    setSelectedSystems,
    setSelectedGameModes,
    setSelectedThemes,
    clear,
  } = useGamesFiltersStore();

  const [game, setGame] = useState<IGDBGame>();
  const [isLoading, setIsLoading] = useState(false);
  const [isGameLoading, setIsGameLoading] = useState(true);

  useEffect(() => {
    !!query.slug &&
      IGDBApi.getGameBySlug(query.slug as string)
        .then((response) => {
          setGame(response.data);
          setTimeout(() => setIsGameLoading(false), 200);
        })
        .catch(axiosUtils.toastError);
  }, [query]);

  useEffect(() => {
    !!game && setIsLoading(!!game.cover);
  }, [game]);

  if (!game) return null;

  const minimalGame = {
    ...game,
    screenshots: game.screenshots.map((item) => item._id),
    artworks: game.artworks.map((item) => item._id),
    game_modes: game.game_modes.map((item) => item._id),
    genres: game.genres.map((item) => item._id),
    involved_companies: game.involved_companies.map((item) => item._id),
    keywords: game.keywords.map((item) => item._id),
    themes: game.themes.map((item) => item._id),
    websites: game.websites.map((item) => item._id),
  };

  const releaseDate = new Date(game.first_release_date * 1000).getFullYear();
  const category = Object.keys(gameCategories).find(
    (key) => gameCategories[key] === game.category
  );

  if (isGameLoading || !isReady) return <Loader type="pacman" />;

  return (
    <>
      <ExpandMenu position="left" titleOpen="Actions">
        <ButtonGroup
          wrapperClassName={styles.page__actions}
          buttons={[
            {
              color: "accent",
              title:
                (royalGames?.some((royal) => royal._id === game._id)
                  ? "Remove from"
                  : "Add to") + " royal games",
              callback: () => {
                royalGames?.some((royal) => royal._id === game._id)
                  ? removeRoyalGame(minimalGame)
                  : addRoyalGame(minimalGame);
              },
            },
            {
              title: "Search on Youtube",
              link: `https://www.youtube.com/results?search_query=${game.name}`,
              target: "_blank",
            },
            {
              title: "Search on RetroAchievements",
              link: `https://retroachievements.org/searchresults.php?s=${game.name}&t=1`,
              target: "_blank",
            },
            {
              title: "Search on HowLongToBeat",
              link: `https://howlongtobeat.com/?q=${encodeURI(game.name)}`,
              target: "_blank",
            },
            { title: "Open in IGDB", link: game.url, isHidden: !game.url },
          ]}
        />
      </ExpandMenu>
      <div className={styles.page}>
        <div className={styles.page__left}>
          <div className={styles.page__cover}>
            {isLoading && <Loader />}
            {!!game.cover?.url ? (
              <Image
                onLoadingComplete={() => setIsLoading(false)}
                key={game.cover._id}
                alt="Cover"
                src={getImageLink(game.cover.url, "cover_big", 2)}
                width={700}
                height={900}
              />
            ) : (
              <Cover />
            )}
          </div>
          <GameControls game={minimalGame} />
        </div>
        <div className={styles.page__right}>
          <h2>{game.name}</h2>
          <div className={styles.page__info}>
            {!!game.first_release_date && (
              <p>
                <span>Year: </span>
                <Link
                  href={"/games"}
                  onClick={() => {
                    clear();
                    setSelectedYears([releaseDate, releaseDate]);
                  }}
                >
                  {releaseDate}
                </Link>
              </p>
            )}
            {!!category && (
              <p>
                <span>Category: </span>
                <Link
                  href={"/games"}
                  onClick={() => {
                    clear();
                    setSelectedCategories([category]);
                  }}
                >
                  {gameCategoryNames[category]}
                </Link>
              </p>
            )}
          </div>
          <div className={styles.page__developers}>
            {game.involved_companies.some((comp) => comp.developer) && (
              <p>
                <span>
                  Developer
                  {game.involved_companies.filter((comp) => comp.developer)
                    .length > 1
                    ? "s"
                    : ""}
                  :{" "}
                </span>
                {game.involved_companies
                  .filter((comp) => comp.developer)
                  ?.map((comp, i, array) => (
                    <>
                      <Link
                        key={comp._id}
                        href={"/games"}
                        onClick={() => {
                          clear();
                          !!comp?.company.name &&
                            setSearchCompany(comp.company.name);
                        }}
                      >
                        {comp.company.name}
                      </Link>
                      {i !== array.length - 1 ? ", " : ""}
                    </>
                  ))}
              </p>
            )}
            {game.involved_companies.some((comp) => comp.publisher) && (
              <p>
                <span>
                  Publisher
                  {game.involved_companies.filter((comp) => comp.publisher)
                    .length > 1
                    ? "s"
                    : ""}
                  :{" "}
                </span>
                {game.involved_companies
                  .filter((comp) => comp.publisher)
                  ?.map((comp, i, array) => (
                    <>
                      <Link
                        key={comp._id}
                        href={"/games"}
                        onClick={() => {
                          clear();
                          !!comp?.company.name &&
                            setSearchCompany(comp.company.name);
                        }}
                      >
                        {comp.company.name}
                      </Link>
                      {i !== array.length - 1 ? ", " : ""}
                    </>
                  ))}
              </p>
            )}
          </div>
          <div className={styles.page__info}>
            {!!game.platforms?.length && (
              <p>
                <span>Platforms: </span>
                {game.platforms.map((platform, i, array) => (
                  <>
                    <Link
                      key={platform._id}
                      href={"/games"}
                      onClick={() => {
                        clear();
                        !!platform && setSelectedSystems([platform]);
                      }}
                    >
                      {platform.name}
                    </Link>
                    {i !== array.length - 1 ? ", " : ""}
                  </>
                ))}
              </p>
            )}
            {!!game.genres?.length && (
              <p>
                <span>Genres: </span>
                {game.genres.map((genre, i, array) => (
                  <>
                    <Link
                      key={genre._id}
                      href={"/games"}
                      onClick={() => {
                        clear();
                        !!genre && setSelectedGenres([genre]);
                      }}
                    >
                      {genre.name}
                    </Link>
                    {i !== array.length - 1 ? ", " : ""}
                  </>
                ))}
              </p>
            )}
            {!!game.game_modes?.length && (
              <p>
                <span>Game modes: </span>
                {game.game_modes.map((mode, i, array) => (
                  <>
                    <Link
                      key={mode._id}
                      href={"/games"}
                      onClick={() => {
                        clear();
                        !!mode && setSelectedGameModes([mode]);
                      }}
                    >
                      {mode.name}
                    </Link>
                    {i !== array.length - 1 ? ", " : ""}
                  </>
                ))}
              </p>
            )}
            {!!game.themes?.length && (
              <p>
                <span>Themes: </span>
                {game.themes.map((theme, i, array) => (
                  <>
                    <Link
                      key={theme._id}
                      href={"/games"}
                      onClick={() => {
                        clear();
                        !!theme && setSelectedThemes([theme]);
                      }}
                    >
                      {theme.name}
                    </Link>
                    {i !== array.length - 1 ? ", " : ""}
                  </>
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
                {game.release_dates.map((date, i) => (
                  <p key={i}>
                    {date.human}: {date.platform.name}
                    <span> ({dateRegions[date.region - 1]})</span>
                  </p>
                ))}
              </div>
            )}
            {!!game.websites?.length && (
              <div className={styles.page__links}>
                <h4>Links:</h4>
                {game.websites.map((link, i) => (
                  <Link target="_blank" key={i} href={link.url}>
                    {link.url.split("/")[2]}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
