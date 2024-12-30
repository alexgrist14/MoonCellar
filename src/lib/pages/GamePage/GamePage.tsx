import { FC, useEffect, useState } from "react";
import styles from "./GamePage.module.scss";
import Image from "next/image";
import { IGDBGame, IGDBScreenshot } from "../../shared/types/igdb";
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
import { ButtonGroup } from "../../shared/ui/Button/ButtonGroup";
import { useGamesStore } from "../../shared/store/games.store";
import classNames from "classnames";
import { axiosUtils } from "../../shared/utils/axios";
import { IGDBApi } from "../../shared/api";
import { useStatesStore } from "../../shared/store/states.store";
import { WrapperTemplate } from "../../shared/ui/WrapperTemplate";

export const GamePage: FC<{ game: IGDBGame }> = ({ game }) => {
  const { royalGames, addRoyalGame, removeRoyalGame } = useGamesStore();
  const { isMobile } = useStatesStore();

  const [isLoading, setIsLoading] = useState<boolean>(!!game.cover?.url);
  const [bg, setBg] = useState<IGDBScreenshot & { gameId: number }>();
  const [isImageReady, setIsImageReady] = useState(true);

  useEffect(() => {
    const pictures: number[] = [];

    if (!!game) {
      if (!!game.artworks?.length) {
        game.artworks.forEach((art) => pictures.push(art._id));
      } else {
        game.screenshots.forEach((screen) => pictures.push(screen._id));
      }

      const id = pictures[Math.floor(Math.random() * (pictures.length - 1))];

      if (!id) return;

      (!!game.artworks?.length ? IGDBApi.getArtwork : IGDBApi.getScreenshot)(id)
        .then((res) => {
          setIsImageReady(false);
          setBg({ ...res.data, gameId: game._id });
        })
        .catch(axiosUtils.toastError);
    }
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

  return (
    <>
      {isMobile && (
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
              {
                title: "Open in IGDB",
                link: game.url,
                isHidden: !game.url,
                target: "_blank",
              },
            ]}
          />
        </ExpandMenu>
      )}
      <div className={classNames("container", styles.page)}>
        <div
          className={classNames(styles.page__bg, {
            [styles.page__bg_active]:
              !!bg && !!game && game._id === bg.gameId && isImageReady,
          })}
        >
          <Image
            onLoad={() => setIsImageReady(true)}
            key={bg?._id}
            alt="Background"
            src={!!bg?.url ? getImageLink(bg.url, "1080p") : "/images/moon.jpg"}
            width={1920}
            height={1080}
          />
        </div>
        <div className={styles.page__left}>
          <WrapperTemplate contentStyle={{ padding: "0", gap: "0" }}>
            <div className={styles.page__cover}>
              {isLoading && <Loader />}
              {!!game.cover?.url ? (
                <Image
                  onLoad={() => setIsLoading(false)}
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
          </WrapperTemplate>
          {!isMobile && (
            <WrapperTemplate
              wrapperStyle={{ marginTop: "40px" }}
              contentStyle={{ padding: "10px" }}
            >
              <ButtonGroup
                wrapperClassName={styles.page__actions}
                buttons={[
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
                    link: `https://howlongtobeat.com/?q=${encodeURI(
                      game.name
                    )}`,
                    target: "_blank",
                  },
                  {
                    title: "Open in IGDB",
                    link: game.url,
                    isHidden: !game.url,
                    target: "_blank",
                  },
                ]}
              />
            </WrapperTemplate>
          )}
        </div>
        <WrapperTemplate classNameContent={styles.page__right}>
          <h2>{game.name}</h2>
          <div className={styles.page__info}>
            {!!game.first_release_date && (
              <p>
                <span>Year: </span>
                <Link
                  href={`/games?years[]=${releaseDate}&years[]=${releaseDate}`}
                >
                  {releaseDate}
                </Link>
              </p>
            )}
            {!!category && (
              <p>
                <span>Category: </span>
                <Link href={`/games?categories[]=${category}`}>
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
                    <span key={comp._id}>
                      <Link href={`/games?company=${comp.company.name}`}>
                        {comp.company.name}
                      </Link>
                      {i !== array.length - 1 ? ", " : ""}
                    </span>
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
                    <span key={comp._id}>
                      <Link href={`/games?company=${comp.company.name}`}>
                        {comp.company.name}
                      </Link>
                      {i !== array.length - 1 ? ", " : ""}
                    </span>
                  ))}
              </p>
            )}
          </div>
          <div className={styles.page__info}>
            {!!game.platforms?.length && (
              <p>
                <span>Platforms: </span>
                {game.platforms.map((platform, i, array) => (
                  <span key={platform._id}>
                    <Link href={`/games?selectedPlatforms[]=${platform._id}`}>
                      {platform.name}
                    </Link>
                    {i !== array.length - 1 ? ", " : ""}
                  </span>
                ))}
              </p>
            )}
            {!!game.genres?.length && (
              <p>
                <span>Genres: </span>
                {game.genres.map((genre, i, array) => (
                  <span key={genre._id}>
                    <Link href={`/games?selectedGenres[]=${genre._id}`}>
                      {genre.name}
                    </Link>
                    {i !== array.length - 1 ? ", " : ""}
                  </span>
                ))}
              </p>
            )}
            {!!game.game_modes?.length && (
              <p>
                <span>Game modes: </span>
                {game.game_modes.map((mode, i, array) => (
                  <span key={mode._id}>
                    <Link href={`/games?selectedModes[]=${mode._id}`}>
                      {mode.name}
                    </Link>
                    {i !== array.length - 1 ? ", " : ""}
                  </span>
                ))}
              </p>
            )}
            {!!game.themes?.length && (
              <p>
                <span>Themes: </span>
                {game.themes.map((theme, i, array) => (
                  <span key={theme._id}>
                    <Link href={`/games?selectedThemes[]=${theme._id}`}>
                      {theme.name}
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
                {game.release_dates.map((date) => (
                  <p key={date._id}>
                    {date.human}: {date.platform.name}
                    <span> ({dateRegions[date.region - 1]})</span>
                  </p>
                ))}
              </div>
            )}
            {!!game.websites?.length && (
              <div className={styles.page__links}>
                <h4>Links:</h4>
                {game.websites.map((link) => (
                  <Link target="_blank" key={link._id} href={link.url}>
                    {link.url.split("/")[2]}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </WrapperTemplate>
      </div>
    </>
  );
};
