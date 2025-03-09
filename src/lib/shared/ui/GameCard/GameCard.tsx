import { CSSProperties, FC, ReactNode, useMemo, useRef, useState } from "react";
import styles from "./GameCard.module.scss";
import Link from "next/link";
import { IGDBGameMinimal } from "../../types/igdb";
import classNames from "classnames";
import Image from "next/image";
import {
  coverRatio,
  gameCategories,
  gameCategoryNames,
  getImageLink,
} from "../../constants";
import { Cover } from "../Cover";
import { GameControls } from "../GameControls";
import useCloseEvents from "../../hooks/useCloseEvents";
import { Loader } from "../Loader";
import { useStatesStore } from "../../store/states.store";
import { useWindowResizeAction } from "../../hooks";
import { useDebouncedCallback } from "use-debounce";
import { useAuthStore } from "../../store/auth.store";
import { SvgAchievement } from "../svg";

interface IGameCardProps {
  game: IGDBGameMinimal;
  className?: string;
  style?: CSSProperties;
  spreadDirection?: "width" | "height";
  children?: ReactNode;
}

export const GameCard: FC<IGameCardProps> = ({
  game,
  className,
  style,
  spreadDirection = "width",
  children,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);

  const [isHover, setIsHover] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(!!game.cover);
  const [ratio, setRatio] = useState<{ height?: string; width?: string }>();

  const { profile } = useAuthStore();

  const {isMastered, isBeaten} = useMemo(() => {
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

  const { isMobile } = useStatesStore();

  const debouncedSetRatio = useDebouncedCallback((rect: DOMRect) => {
    setRatio(
      spreadDirection === "width"
        ? {
            height: `calc(${rect.width}px / ${coverRatio})`,
          }
        : {
            width: `calc(${rect.height}px * ${coverRatio})`,
          },
    );
  }, 300);

  useCloseEvents([cardRef], () => setStepIndex(0));
  useWindowResizeAction(() => {
    const rect = cardRef.current?.getBoundingClientRect();

    !!rect && debouncedSetRatio(rect);
  }, [spreadDirection]);

  if (!game) return null;

  return (
    <div
      className={classNames(styles.wrapper, !!ratio && styles.wrapper_active)}
    >
      <div
        key={game._id}
        ref={cardRef}
        className={classNames(
          styles.card,
          className,
          spreadDirection === "height" && styles.card_height,
        )}
        style={{
          ...ratio,
          ...style,
        }}
        onMouseOver={() => setIsHover(true)}
        onMouseOut={() => setIsHover(false)}
        onClick={(e) => {
          if (!stepIndex && isMobile) {
            e.preventDefault();
            e.stopPropagation();

            return setStepIndex(1);
          }
        }}
        draggable={false}
      >
        {!!game.raIds?.length && (
          <div
            className={classNames(styles.card__ra, {
              [styles.card__ra_beaten]: isBeaten,
              [styles.card__ra_mastered]: isMastered,
            })}
          >
            <SvgAchievement />
          </div>
        )}
        <div
          className={classNames(styles.card__info, {
            [styles.card__info_active]:
              isHover || (stepIndex === 1 && isMobile),
          })}
        >
          <Link
            draggable={false}
            className={styles.card__title}
            href={`/games/${game.slug}`}
          >
            <p>{game.name}</p>
            <span>
              {`${
                gameCategoryNames[
                  Object.keys(gameCategories).find(
                    (key) => gameCategories[key] === game.category,
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
            onLoad={() => setIsLoading(false)}
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
      {children}
    </div>
  );
};
