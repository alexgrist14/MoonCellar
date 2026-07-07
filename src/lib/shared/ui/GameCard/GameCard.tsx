import { CSSProperties, memo, useMemo, useRef, useState } from "react";
import styles from "./GameCard.module.scss";
import classNames from "classnames";
import Image from "next/image";
import { Cover } from "../Cover";
import { Loader } from "../Loader";
import { useUserStore } from "../../store/user.store";
import { GameCardInfo } from "@/src/lib/entities/game/ui/GameCardInfo";
import { IGameResponse } from "../../lib/schemas/games.schema";
import useCloseEvents from "../../hooks/useCloseEvents";
import { Button } from "../Button";
import { SvgMore } from "../svg";
import Link from "next/link";
import { useGamesStore } from "../../store/games.store";
import { SvgCrown } from "../svg/SvgCrown";

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
    const [isActive, setIsActive] = useState(false);

    const { parsedPlaythroughs, parsedRatings } = useUserStore();
    const royalGames = useGamesStore((s) => s.royalGames);

    const filteredPlaythroughs = parsedPlaythroughs?.[game._id];

    const rating = parsedRatings?.[game._id];

    const isRoyal = useMemo(
      () => royalGames?.some((royal) => royal._id === game?._id),
      [game, royalGames]
    );

    useCloseEvents([cardRef], () => setIsActive(false));

    if (!game) return null;

    return (
      <div
        className={classNames(
          styles.wrapper,
          spreadDirection === "height" && styles.wrapper_height
        )}
        style={style}
        ref={cardRef}
      >
        <Link
          href={`/games/${game.slug}`}
          key={game._id}
          className={classNames(
            styles.card,
            className,
            filteredPlaythroughs
              ?.map((play) => styles[`card_${play.category}`])
              .at(-1),
            !!filteredPlaythroughs &&
              filteredPlaythroughs.some((play) => play.isMastered) &&
              styles.card_mastered
          )}
          draggable={false}
        >
          {!!isRoyal && (
            <div className={styles.card__royal}>
              <SvgCrown size="20" color="contrast-reverse" />
            </div>
          )}
          {!!rating && (
            <div className={styles.card__rating}>
              <p>{rating}</p>
            </div>
          )}
          <Button
            color="transparent"
            className={styles.card__more}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();

              setIsActive(true);
            }}
          >
            <SvgMore />
          </Button>
          {isLoading && <Loader key={game._id + "_loader"} />}
          {isActive && (
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
        </Link>
      </div>
    );
  }
);

GameCard.displayName = "GameCard";
