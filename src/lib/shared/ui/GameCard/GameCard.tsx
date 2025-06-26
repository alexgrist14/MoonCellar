import { CSSProperties, memo, useMemo, useRef, useState } from "react";
import styles from "./GameCard.module.scss";
import { IGDBGameMinimal } from "../../types/igdb";
import classNames from "classnames";
import Image from "next/image";
import { getImageLink } from "../../constants";
import { Cover } from "../Cover";
import { GameControls } from "../GameControls";
import { Loader } from "../Loader";
import { useStatesStore } from "../../store/states.store";
import { useAuthStore } from "../../store/auth.store";
import { SvgAchievement } from "../svg";
import { useUserStore } from "../../store/user.store";
import { GameCardInfo } from "@/src/lib/entities/game/ui/GameCardInfo";
import useCloseEvents from "../../hooks/useCloseEvents";

interface IGameCardProps {
  game: IGDBGameMinimal;
  className?: string;
  style?: CSSProperties;
  spreadDirection?: "width" | "height";
}

export const GameCard = memo(
  ({ game, className, style, spreadDirection = "width" }: IGameCardProps) => {
    const cardRef = useRef<HTMLDivElement>(null);

    const [isHover, setIsHover] = useState(false);
    const [stepIndex, setStepIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(!!game.cover);

    const { profile } = useAuthStore();
    const { isMobile } = useStatesStore();
    const { playthroughs } = useUserStore();

    const playthrough = useMemo(() => {
      return playthroughs?.findLast((play) => play.gameId === game._id);
    }, [playthroughs, game]);

    const { isMastered, isBeaten } = useMemo(() => {
      const mastered = profile?.raAwards?.filter(
        (award) => award.awardType === "Mastery/Completion"
      );
      const beaten = profile?.raAwards?.filter(
        (award) => award.awardType === "Game Beaten"
      );
      const raIds = game.raIds?.map((game) => game._id);

      return {
        isMastered: mastered?.some((award) => raIds?.includes(award.awardData)),
        isBeaten: beaten?.some((award) => raIds?.includes(award.awardData)),
      };
    }, [game, profile]);

    useCloseEvents([cardRef], () => setStepIndex(0));

    if (!game) return null;

    return (
      <div
        className={classNames(
          styles.wrapper,
          styles.wrapper_active,
          spreadDirection === "height" && styles.wrapper_height
        )}
      >
        <div
          key={game._id}
          ref={cardRef}
          className={classNames(
            styles.card,
            className,
            !!playthrough &&
              !playthrough.isMastered &&
              styles[`card_${playthrough.category}`],
            !!playthrough && playthrough.isMastered && styles.card_mastered
          )}
          style={style}
          onMouseEnter={() => setIsHover(true)}
          onMouseLeave={() => setIsHover(false)}
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
          {isLoading && <Loader key={game._id + "_loader"} />}
          {isHover && (
            <GameCardInfo
              bottomNode={
                <GameControls className={styles.card__controls} game={game} />
              }
              game={game}
            />
          )}
          {!!game?.cover ? (
            <Image
              onLoad={() => setIsLoading(false)}
              alt="Game cover"
              src={getImageLink(game?.cover?.url, "720p")}
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
