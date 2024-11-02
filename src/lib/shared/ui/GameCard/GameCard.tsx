import { FC, useState } from "react";
import styles from "./GameCard.module.scss";
import Link from "next/link";
import { IGDBGame } from "../../types/igdb";
import classNames from "classnames";
import Image from "next/image";
import { modal } from "../Modal";
import { getImageLink } from "../../constants";
import { Cover } from "../Cover";

interface IGameCardProps {
  game: IGDBGame;
}

export const GameCard: FC<IGameCardProps> = ({ game }) => {
  const [isHover, setIsHover] = useState(false);

  return (
    <Link
      className={styles.card}
      href={`/games/${game.slug}`}
      onMouseOver={() => setIsHover(true)}
      onMouseOut={() => setIsHover(false)}
      onClick={() => modal.close()}
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
      {!!game?.cover ?(
        <Image
        alt="Game cover"
        src={getImageLink(game?.cover?.url, "cover_big")
        }
        width={500}
        height={500}
        className={styles.card__cover}
        priority
      />
      ) : <Cover/>}
      
    </Link>
  );
};
