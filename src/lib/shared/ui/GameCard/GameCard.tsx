import { CSSProperties, memo, useMemo, useRef, useState } from "react";
import styles from "./GameCard.module.scss";
import classNames from "classnames";
import Image from "next/image";
import { Cover } from "../Cover";
import { GameControls } from "../GameControls";
import { Loader } from "../Loader";
import { useStatesStore } from "../../store/states.store";
import { useAuthStore } from "../../store/auth.store";
import { SvgAchievement } from "../svg";
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

    const profile = useAuthStore((s) => s.profile);
    const isMobile = useStatesStore((s) => s.isMobile);
    const playthroughs = useUserStore((s) => s.playthroughs);

    const filteredPlaythroughs = useMemo(() => {
      return playthroughs?.filter((play) => play.gameId === game._id);
    }, [playthroughs, game]);

    const { isMastered, isBeaten } = useMemo(() => {
      const mastered = profile?.raAwards?.filter(
        (award) => award.awardType === "Mastery/Completion"
      );
      const beaten = profile?.raAwards?.filter(
        (award) => award.awardType === "Game Beaten"
      );
      const raIds = game.retroachievements?.map((item) => item.gameId);

      return {
        isMastered: mastered?.some((award) => raIds?.includes(award.awardData)),
        isBeaten: beaten?.some((award) => raIds?.includes(award.awardData)),
      };
    }, [game, profile]);

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
          onClick={() => isMobile && setIsHover(true)}
          onMouseEnter={() => !isMobile && setIsHover(true)}
          onMouseLeave={() => !isMobile && setIsHover(false)}
          draggable={false}
        >
          {!!game.retroachievements?.length && (
            <div
              className={classNames(styles.card__ra, {
                [styles.card__ra_beaten]: isBeaten,
                [styles.card__ra_mastered]: isMastered,
              })}
            >
              <SvgAchievement />
            </div>
          )}
          {isLoading && <Loader key={game._id + "_loader"} />}
          {isHover && (
            <GameCardInfo
              bottomNode={
                <GameControls className={styles.card__controls} game={game} />
              }
              game={game}
              playthroughs={filteredPlaythroughs}
            />
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
      </div>
    );
  }
);

GameCard.displayName = "GameCard";
