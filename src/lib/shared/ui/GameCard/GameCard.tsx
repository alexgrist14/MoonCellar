import { FC, useRef, useState } from "react";
import styles from "./GameCard.module.scss";
import Link from "next/link";
import { IGDBGameMinimal } from "../../types/igdb";
import classNames from "classnames";
import Image from "next/image";
import { modal } from "../Modal";
import { getImageLink } from "../../constants";
import { Cover } from "../Cover";
import { GameControls } from "../GameControls";
import { useCommonStore } from "../../store/common.store";
import useCloseEvents from "../../hooks/useCloseEvents";
import { Loader } from "../Loader";

interface IGameCardProps {
  game: IGDBGameMinimal;
}

export const GameCard: FC<IGameCardProps> = ({ game }) => {
  const cardRef = useRef<HTMLDivElement>(null);

  const [isHover, setIsHover] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(!!game.cover);

  const { isMobile } = useCommonStore();

  const releaseYear = game.release_dates?.reduce(
    (year: number | undefined, date) =>
      !!date.y ? (!!year && date.y > year ? year : (year = date.y)) : year,
    undefined
  );

  useCloseEvents([cardRef], () => setStepIndex(0));

  if (!game) return null;

  return (
    <div
      key={game._id}
      ref={cardRef}
      className={styles.card}
      onMouseOver={() => setIsHover(true)}
      onMouseOut={() => setIsHover(false)}
    >
      <div
        className={classNames(styles.card__info, {
          [styles.card__info_active]: isHover || (stepIndex === 1 && isMobile),
        })}
      >
        <Link
          className={styles.card__title}
          href={`/games/${game.slug}`}
          onClick={(e) => {
            if (!stepIndex && isMobile) {
              e.preventDefault();
              e.stopPropagation();

              return setStepIndex(1);
            }

            modal.close();
          }}
        >
          <p>
            {game.name}
            {!!releaseYear ? ` (${releaseYear})` : ""}
          </p>
          <span>
            {!!game.platforms?.length &&
              game.platforms.map((platform) => platform.name).join(", ")}
          </span>
        </Link>
        <GameControls game={game} />
      </div>
      {isLoading && <Loader key={game._id + "_loader"} />}
      {!!game?.cover ? (
        <Image
          onLoad={() => setTimeout(() => setIsLoading(false), 200)}
          alt="Game cover"
          src={getImageLink(game?.cover?.url, "720p")}
          width={700}
          height={500}
          className={classNames(styles.card__cover, {
            [styles.card__cover_active]: !isLoading,
          })}
        />
      ) : (
        <Cover />
      )}
    </div>
  );
};
