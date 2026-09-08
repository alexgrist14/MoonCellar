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
import { SvgAchievement, SvgClose, SvgMore, SvgStar } from "../svg";
import Link from "next/link";
import { useGamesStore } from "../../store/games.store";
import { SvgCrown } from "../svg/SvgCrown";
import { useHideAdult } from "../../hooks/useHideAdult";
import { isAdultGame } from "../../utils/adult.utils";
import { GameControls } from "../GameControls";
import { modal } from "../Modal";
import { AchievementsModal } from "../AchievementsModal";
import { useAuthStore } from "../../store/auth.store";
import { playthroughPriorityOrder } from "../../constants/user.const";
import { getAverageRating } from "../../utils/rating.utils";
import { GameRatingPopover } from "@/src/lib/features/game/GameRatingPopover";

interface IGameCardProps {
  game: IGameResponse;
  className?: string;
  style?: CSSProperties;
  spreadDirection?: "width" | "height";
  isInfoDisabled?: boolean;
  priority?: boolean;
  rank?: number;
  isWithCombinedRating?: boolean;
}

export const GameCard = memo(
  ({
    game,
    className,
    style,
    spreadDirection = "width",
    isInfoDisabled,
    priority,
    rank,
    isWithCombinedRating,
  }: IGameCardProps) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const ratingRef = useRef<HTMLDivElement>(null);

    const [isRatingOpen, setIsRatingOpen] = useState(false);

    const hideMedia = useHideAdult() && isAdultGame(game);

    const combinedRating = useMemo(
      () =>
        isWithCombinedRating || isInfoDisabled ? getAverageRating(game) : null,
      [game, isWithCombinedRating, isInfoDisabled]
    );

    const [isLoading, setIsLoading] = useState(!!game.cover && !hideMedia);
    const [isActive, setIsActive] = useState(false);

    const { parsedPlaythroughs, parsedRatings } = useUserStore();
    const royalGames = useGamesStore((s) => s.royalGames);
    const addRoyalGame = useGamesStore((s) => s.addRoyalGame);
    const removeRoyalGame = useGamesStore((s) => s.removeRoyalGame);
    const profile = useAuthStore((s) => s.profile);

    const filteredPlaythroughs = useMemo(
      () => parsedPlaythroughs?.[game._id],
      [game._id, parsedPlaythroughs]
    );

    const lastPlaythrough = useMemo(
      () =>
        filteredPlaythroughs?.length
          ? [...filteredPlaythroughs]
              .sort(
                (a, b) =>
                  playthroughPriorityOrder.indexOf(
                    a.isMastered ? "mastered" : a.category
                  ) -
                  playthroughPriorityOrder.indexOf(
                    b.isMastered ? "mastered" : b.category
                  )
              )
              .at(-1)
          : undefined,
      [filteredPlaythroughs]
    );

    const rating = parsedRatings?.[game._id];

    const isRoyal = useMemo(
      () => royalGames?.includes(game?._id),
      [game, royalGames]
    );

    const { isMastered, isBeaten } = useMemo(() => {
      if (!profile?.raAwards?.length || !game.retroachievements?.length) {
        return { isMastered: false, isBeaten: false };
      }

      const raIds = new Set(game.retroachievements.map((item) => item.gameId));

      return {
        isMastered: profile.raAwards.some(
          (award) =>
            award.awardType === "Mastery/Completion" &&
            raIds.has(award.awardData)
        ),
        isBeaten: profile.raAwards.some(
          (award) =>
            award.awardType === "Game Beaten" && raIds.has(award.awardData)
        ),
      };
    }, [game, profile]);

    // useCloseEvents([cardRef], () => setIsActive(false));

    if (!game) return null;

    return (
      <div
        className={classNames(
          styles.wrapper,
          spreadDirection === "height" && styles.wrapper_height,
          isInfoDisabled && styles.wrapper_stacked
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
            styles[
              `card_${lastPlaythrough?.isMastered ? "mastered" : lastPlaythrough?.category}`
            ],
            isInfoDisabled && styles.card_stacked
          )}
          draggable={false}
        >
          {(!!rank || !!profile?._id) && (
            <div
              className={classNames(
                styles.card__rail,
                styles.card__rail_topLeft
              )}
            >
              {!!rank && <div className={styles.card__rank}>{rank}</div>}
              {!!profile?._id && (
                <div
                  className={classNames(styles.card__royal, {
                    [styles.card__royal_empty]: !isRoyal,
                  })}
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();

                    isRoyal
                      ? removeRoyalGame(game._id)
                      : addRoyalGame(game._id);
                  }}
                >
                  <SvgCrown
                    size="16"
                    color={isRoyal ? "contrast-reverse" : "secondary"}
                  />
                </div>
              )}
            </div>
          )}
          {!!profile?._id && (
            <div
              className={classNames(
                styles.card__rail,
                styles.card__rail_bottomLeft
              )}
              ref={ratingRef}
            >
              <div
                className={classNames(styles.card__rating, {
                  [styles.card__rating_empty]: !rating,
                })}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  setIsRatingOpen((current) => !current);
                }}
              >
                {!!rating ? <p>{rating}</p> : <SvgStar size="16" />}
              </div>
            </div>
          )}
          {(!!game.retroachievements?.length || !!combinedRating) && (
            <div
              className={classNames(
                styles.card__rail,
                styles.card__rail_bottomRight
              )}
            >
              {!!game.retroachievements?.length && (
                <div
                  className={styles.card__achievement}
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();

                    modal.open(<AchievementsModal game={game} />, {
                      id: "game-achievements",
                    });
                  }}
                >
                  <SvgAchievement
                    color={
                      isMastered
                        ? "attention"
                        : isBeaten
                          ? "positive"
                          : "secondary"
                    }
                  />
                </div>
              )}
              {!!combinedRating && (
                <div className={styles.card__combined}>
                  <SvgStar size="12" fillPercent={100} />
                  <span>{combinedRating}</span>
                </div>
              )}
            </div>
          )}
          {!isInfoDisabled && (
            <div
              className={classNames(
                styles.card__rail,
                styles.card__rail_topRight
              )}
            >
              <Button
                color="transparent"
                className={classNames(
                  styles.card__more,
                  isActive &&
                    styles[
                      `card__more_${lastPlaythrough?.isMastered ? "mastered" : lastPlaythrough?.category}`
                    ]
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();

                  setIsActive(!isActive);
                }}
              >
                {isActive ? <SvgClose size="16" /> : <SvgMore />}
              </Button>
            </div>
          )}
          {isLoading && <Loader key={game._id + "_loader"} />}
          {isActive && (
            <GameCardInfo game={game} playthroughs={filteredPlaythroughs} />
          )}
          {!!game?.cover && !hideMedia ? (
            <Image
              onLoad={() => setIsLoading(false)}
              alt={`${game.name} cover`}
              src={game.cover}
              width={260}
              height={325}
              priority={priority}
              className={classNames(styles.card__cover, {
                [styles.card__cover_active]: !isLoading,
              })}
            />
          ) : (
            <Cover className={styles.card__placeholder} />
          )}
        </Link>
        <GameRatingPopover
          game={game}
          anchorRef={ratingRef}
          isOpen={isRatingOpen}
          onClose={() => setIsRatingOpen(false)}
        />
        {isInfoDisabled && (
          <GameControls game={game} className={styles.card__controls} />
        )}
      </div>
    );
  }
);

GameCard.displayName = "GameCard";
