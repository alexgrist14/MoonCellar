import { FC, useState } from "react";
import styles from "./GameCard.module.scss";
import Link from "next/link";
import { IGDBGame } from "../../types/igdb";
import classNames from "classnames";
import Image from "next/image";
import { modal } from "../Modal";
import { getImageLink } from "../../constants";
import { Cover } from "../Cover";
import { GameControls } from "../GameControls";

interface IGameCardProps {
  game: IGDBGame;
}

export const GameCard: FC<IGameCardProps> = ({ game }) => {
  const [isHover, setIsHover] = useState(false);
  const releaseYear = game.release_dates?.reduce(
    (year: number | undefined, date) =>
      !!date.y ? (!!year && date.y > year ? year : (year = date.y)) : year,
    undefined
  );

  return (
    <div
      className={styles.card}
      onMouseOver={() => setIsHover(true)}
      onMouseOut={() => setIsHover(false)}
    >
      <div
        className={classNames(styles.card__info, {
          [styles.card__info_active]: isHover,
        })}
      >
        <Link
          className={styles.card__title}
          href={`/games/${game.slug}`}
          onClick={() => modal.close()}
        >
          <span>
            {!!game.platforms?.length &&
              game.platforms.map((platform) => platform.name).join(", ")}
          </span>
          <p>
            {game.name}
            {!!releaseYear ? ` (${releaseYear})` : ""}
          </p>
        </Link>
        <GameControls
          isWithoutTooltips
          className={styles.card__controls}
          game={game}
        />
      </div>
      {!!game?.cover ? (
        <Image
          alt="Game cover"
          src={getImageLink(game?.cover?.url, "cover_big")}
          width={500}
          height={500}
          className={styles.card__cover}
          priority
        />
      ) : (
        <Cover />
      )}
    </div>
  );
};
