import { FC, useMemo, useState } from "react";
import styles from "./GamePage.module.scss";
import Image from "next/image";
import { IGDBGame } from "../../shared/types/igdb";
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
import classNames from "classnames";
import { useStatesStore } from "../../shared/store/states.store";
import { WrapperTemplate } from "../../shared/ui/WrapperTemplate";
import { useAuthStore } from "../../shared/store/auth.store";
import { BGImage } from "../../shared/ui/BGImage";
import { GameButtons } from "../../shared/ui/GameButtons";
import { Icon } from "@iconify/react/dist/iconify.js";

export const GamePage: FC<{ game: IGDBGame }> = ({ game }) => {
  const { isAuth, profile } = useAuthStore();
  const { isMobile } = useStatesStore();

  const [isLoading, setIsLoading] = useState<boolean>(!!game.cover?.url);

  const minimalGame = useMemo(
    () => ({
      ...game,
      screenshots: game.screenshots.map((item) => item._id),
      artworks: game.artworks.map((item) => item._id),
      game_modes: game.game_modes.map((item) => item._id),
      genres: game.genres.map((item) => item._id),
      involved_companies: game.involved_companies.map((item) => item._id),
      keywords: game.keywords.map((item) => item._id),
      themes: game.themes.map((item) => item._id),
      websites: game.websites.map((item) => item._id),
    }),
    [game],
  );

  const { isMastered, isBeaten } = useMemo(() => {
    const mastered = profile?.raAwards?.filter(
      (award) => award.awardType === "Mastery/Completion",
    );
    const beaten = profile?.raAwards?.filter(
      (award) => award.awardType === "Game Beaten",
    );
    const raIds = game.raIds?.map((game) => game._id);

    return {
      isMastered: mastered?.some((award) => raIds?.includes(award.awardData)),
      isBeaten: beaten?.some((award) => raIds?.includes(award.awardData)),
    };
  }, [game, profile]);

  if (!game) return null;

  const releaseDate = new Date(game.first_release_date * 1000).getFullYear();
  const category = Object.keys(gameCategories).find(
    (key) => gameCategories[key] === game.category,
  );

  return (
    <>
      {isMobile && (
        <ExpandMenu position="left" titleOpen="Actions">
          <GameButtons game={minimalGame} />
        </ExpandMenu>
      )}
      <div className={classNames(styles.page)}>
        <BGImage game={minimalGame} />
        <div className={styles.page__left}>
          <WrapperTemplate contentStyle={{ padding: "0", gap: "0" }}>
            <div
              className={classNames(
                styles.page__cover,
                isAuth && styles.page__cover_control,
              )}
            >
              {!!game.raIds?.length && (
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
              <GameButtons game={minimalGame} />
            </WrapperTemplate>
          )}
        </div>
        <WrapperTemplate
          classNameContent={styles.page__right}
          contentStyle={{ padding: "10px" }}
        >
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
          {!!game.keywords?.length && (
            <div className={styles.page__info}>
              <p>
                <span>Keywords: </span>
                {game.keywords.map((keyword, i, array) => (
                  <span key={keyword._id}>
                    <Link href={`/games?selectedKeywords[]=${keyword._id}`}>
                      {keyword.name}
                    </Link>
                    {i !== array.length - 1 ? ", " : ""}
                  </span>
                ))}
              </p>
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
