import { FC, useState } from "react";
import styles from "./GameCard.module.scss";
import Link from "next/link";
import { IGDBGame } from "../../types/igdb";
import classNames from "classnames";
import Image from "next/image";

interface IGameCardProps {
  game: IGDBGame;
}

export const GameCard: FC<IGameCardProps> = ({ game }) => {
  const [isHover, setIsHover] = useState(false);

  return (
    <Link
      className={styles.card}
      href={`/game/${game._id}`}
      onMouseOver={() => setIsHover(true)}
      onMouseOut={() => setIsHover(false)}
    >
      <div
        className={classNames(styles.card__title, {
          [styles.card__title_active]: isHover,
        })}
      >
        <p>{game.name}</p>
        {!!game.platforms?.length && (
          <span>
            {game.platforms.map((platform) => platform.name).join(", ")}
          </span>
        )}
      </div>
      <Image
        alt="Game cover"
        src={
          !!game?.cover?.length
            ? "https:" + game?.cover[0]?.url.replace("thumb", "cover_big")
            : "/images/helen.png"
        }
        width={200}
        height={300}
        className={styles.card__cover}
      />
    </Link>
  );
};
