import { FC, useEffect, useState } from "react";
import styles from "./GamePage.module.scss";
import Image from "next/image";
import { IGDBGame } from "../../shared/types/igdb";
import { useRouter } from "next/router";
import { IGDBApi } from "../../shared/api";
import { axiosUtils } from "../../shared/utils/axios";
import { getImageLink } from "../../shared/constants";
import { Slideshow } from "../../shared/ui/Slideshow";

export const GamePage: FC = () => {
  const { query } = useRouter();

  const [game, setGame] = useState<IGDBGame>();

  useEffect(() => {
    !!query.id &&
      IGDBApi.getGameById(query.id as string)
        .then((response) => setGame(response.data))
        .catch(axiosUtils.toastError);
  }, [query]);

  if (!game) return null;

  return (
    <div className={styles.page}>
      <div className={styles.page__left}>
        {!!game.cover && (
          <Image
            key={game.cover._id}
            alt="Cover"
            src={
              !!game.cover && game.cover.url
                ? getImageLink(game.cover.url, "cover_big", 2)
                : "/images/helen.png"
            }
            width={game.cover.width || 700}
            height={game.cover.height || 900}
          />
        )}
      </div>
      <div className={styles.page__right}>
        <h2>{game.name}</h2>
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
        <div className={styles.page__text}>
          <h4>Summary:</h4>
          <p>{game.summary}</p>
        </div>
        {!!game.storyline && (
          <div className={styles.page__text}>
            <h4>Storyline:</h4>
            <p>{game.storyline}</p>
          </div>
        )}
        {!!game.screenshots?.length && (
          <div className={styles.page__screenshots}>
            <Slideshow
              pictures={[
                ...game.screenshots,
                ...(!!game.artworks?.length ? game.artworks : []),
              ]}
            />
          </div>
        )}
      </div>
    </div>
  );
};
