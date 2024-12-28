import { FC, useRef, useState } from "react";
import styles from "./GameCard.module.scss";
import Link from "next/link";
import { IGDBGameMinimal } from "../../types/igdb";
import classNames from "classnames";
import Image from "next/image";
import { modal } from "../Modal";
import {
  gameCategories,
  gameCategoryNames,
  getImageLink,
} from "../../constants";
import { Cover } from "../Cover";
import { GameControls } from "../GameControls";
import useCloseEvents from "../../hooks/useCloseEvents";
import { Loader } from "../Loader";
import { useStatesStore } from "../../store/states.store";

interface IGameCardProps {
  game: IGDBGameMinimal;
}

export const GameCard: FC<IGameCardProps> = ({ game }) => {
  const cardRef = useRef<HTMLDivElement>(null);

  const [isHover, setIsHover] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(!!game.cover);

  const { isMobile } = useStatesStore();

  useCloseEvents([cardRef], () => setStepIndex(0));

  if (!game) return null;

  return (
    <div
      key={game._id}
      ref={cardRef}
      className={styles.card}
      onMouseOver={() => setIsHover(true)}
      onMouseOut={() => setIsHover(false)}
      draggable={false}
    >
      <div
        className={classNames(styles.card__info, {
          [styles.card__info_active]: isHover || (stepIndex === 1 && isMobile),
        })}
      >
        <Link
          draggable={false}
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
          <p>{game.name}</p>
          <span>
            {`${
              gameCategoryNames[
                Object.keys(gameCategories).find(
                  (key) => gameCategories[key] === game.category
                ) || ""
              ]
            }`}
            {!!game.first_release_date
              ? ` - ${new Date(game.first_release_date * 1000).getFullYear()}`
              : ""}
          </span>
          <span>
            {!!game.platforms?.length &&
              game.platforms.map((platform) => platform.name).join(", ")}
          </span>
          {!!game.summary &&
            (cardRef.current?.getBoundingClientRect().height || 0) >= 250 && (
              <span>{game.summary}</span>
            )}
        </Link>
        <GameControls className={styles.card__controls} game={game} />
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
        <Cover className={styles.card__placeholder} />
      )}
    </div>
  );
};
