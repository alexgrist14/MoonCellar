import { FC, useEffect, useState } from "react";
import styles from "./GamePage.module.scss";
import Image from "next/image";
import { IGDBGame } from "../../shared/types/igdb";
import { useRouter } from "next/router";
import { IGDBApi } from "../../shared/api";
import { axiosUtils } from "../../shared/utils/axios";
import { dateRegions, getImageLink } from "../../shared/constants";
import { Slideshow } from "../../shared/ui/Slideshow";
import { commonUtils } from "../../shared/utils/common";
import { ExpandMenu } from "../../shared/ui/ExpandMenu";
import { Button } from "../../shared/ui/Button";
import Link from "next/link";
import { useSelectedStore } from "../../shared/store/selected.store";
import { Cover } from "../../shared/ui/Cover";
import { GameControls } from "../../shared/ui/GameControls";

export const GamePage: FC = () => {
  const { query } = useRouter();

  const { royalGames, setRoyalGames } = useSelectedStore();

  const [game, setGame] = useState<IGDBGame>();

  useEffect(() => {
    !!query.slug &&
      IGDBApi.getGameBySlug(query.slug as string)
        .then((response) => setGame(response.data))
        .catch(axiosUtils.toastError);
  }, [query]);

  if (!game) return null;

  console.log();

  return (
    <>
      <ExpandMenu position="left" titleOpen="Actions">
        <div className={styles.page__actions}>
          <Button
            onClick={() => {
              setRoyalGames(
                royalGames?.some((royal) => royal._id === game._id)
                  ? royalGames.filter((royal) => royal._id !== game._id)
                  : [...(!!royalGames?.length ? royalGames : []), game],
              );
            }}
          >
            {royalGames?.some((royal) => royal._id === game._id)
              ? "Remove from"
              : "Add to"}{" "}
            royal games
          </Button>
          <Link
            href={`https://www.youtube.com/results?search_query=${game.name}`}
            target="_blank"
          >
            <Button>Search on Youtube</Button>
          </Link>
          {!!game.url && (
            <Link href={game.url} target="_blank">
              <Button>Open in IGDB</Button>
            </Link>
          )}
        </div>
      </ExpandMenu>
      <div className={styles.page}>
        <div className={styles.page__left}>
          <div className={styles.page__cover}>
            {!!game.cover?.url ? (
              <Image
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
          <GameControls game={game} />
        </div>
        <div className={styles.page__right}>
          <h2>
            {game.name}{" "}
            {!!game.release_dates?.length ? `(${game.release_dates[0].y})` : ""}
          </h2>
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
                  ?.map((comp) => comp.company.name)
                  .join(", ")}
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
                  ?.map((comp) => comp.company.name)
                  .join(", ")}
              </p>
            )}
          </div>
          <div className={styles.page__info}>
            {!!game.platforms?.length && (
              <p>
                <span>Platforms: </span>
                {game.platforms.map((platform) => platform.name).join(", ")}
              </p>
            )}
            {!!game.genres?.length && (
              <p>
                <span>Genres: </span>
                {game.genres.map((genre) => genre.name).join(", ")}
              </p>
            )}
            {!!game.themes?.length && (
              <p>
                <span>Themes: </span>
                {game.themes.map((theme) => theme.name).join(", ")}
              </p>
            )}
            {!!game.keywords?.length && (
              <p>
                <span>Keywords: </span>
                {game.keywords.map((key) => key.name).join(", ")}
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
