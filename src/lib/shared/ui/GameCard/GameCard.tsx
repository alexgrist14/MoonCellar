import { CSSProperties, memo, useRef, useState } from "react";
import styles from "./GameCard.module.scss";
import classNames from "classnames";
import Image from "next/image";
import { Cover } from "../Cover";
import { GameControls } from "../GameControls";
import { Loader } from "../Loader";
import { useStatesStore } from "../../store/states.store";
import { useAuthStore } from "../../store/auth.store";
import { useUserStore } from "../../store/user.store";
import { GameCardInfo } from "@/src/lib/entities/game/ui/GameCardInfo";
import { IGameResponse } from "../../lib/schemas/games.schema";
import useCloseEvents from "../../hooks/useCloseEvents";

interface IGameCardProps {
  game: IGameResponse;
  className?: string;
  style?: CSSProperties;
  spreadDirection?: "width" | "height";
}

export const GameCard = memo(
  ({ game, className, style, spreadDirection = "width" }: IGameCardProps) => {
    const cardRef = useRef<HTMLDivElement>(null);

    const [isLoading, setIsLoading] = useState(!!game.cover);
    const [isHover, setIsHover] = useState(false);

    const isMobile = useStatesStore((s) => s.isMobile);
    const { parsedPlaythroughs, parsedRatings } = useUserStore();

    const filteredPlaythroughs = parsedPlaythroughs?.[game._id];

    const rating = parsedRatings?.[game._id];

    useCloseEvents([cardRef], () => setIsHover(false));

    if (!game) return null;

    return (
      <div
        className={classNames(
          styles.wrapper,
          styles.wrapper_active,
          spreadDirection === "height" && styles.wrapper_height
        )}
        style={style}
        onMouseEnter={() => !isMobile && setIsHover(true)}
        onMouseLeave={() => !isMobile && setIsHover(false)}
        onClick={() => isMobile && setIsHover(true)}
      >
        <div
          key={game._id}
          ref={cardRef}
          className={classNames(
            styles.card,
            className,
            filteredPlaythroughs?.map(
              (play) => styles[`card_${play.category}`]
            ),
            !!filteredPlaythroughs &&
              filteredPlaythroughs.some((play) => play.isMastered) &&
              styles.card_mastered
          )}
          draggable={false}
        >
          {!!rating && (
            <div className={styles.card__rating}>
              <p>{rating}</p>
            </div>
          )}
          {isLoading && <Loader key={game._id + "_loader"} />}
          {isHover && (
            <GameCardInfo game={game} playthroughs={filteredPlaythroughs} />
          )}
          {!!game?.cover ? (
            <Image
              onLoad={() => setIsLoading(false)}
              alt="Game cover"
              src={game.cover}
              width={260}
              height={325}
              className={classNames(styles.card__cover, {
                [styles.card__cover_active]: !isLoading,
              })}
            />
          ) : (
            <Cover className={styles.card__placeholder} />
          )}
        </div>
        {isHover && <GameControls game={game} />}
      </div>
    );
  }
);

GameCard.displayName = "GameCard";
