import { CSSProperties, memo, useMemo, useRef, useState } from "react";
import styles from "./GameCard.module.scss";
import classNames from "classnames";
import Image from "next/image";
import { Cover } from "@/src/lib/shared/ui/Cover";
import { Loader } from "@/src/lib/shared/ui/Loader";
import { useUserStore } from "@/src/lib/shared/store/user.store";
import { GameCardInfo } from "@/src/lib/widgets/game/GameCardInfo";
import { Tooltip } from "@/src/lib/shared/ui/Tooltip";
import { IGameResponse } from "@mooncellar/schemas";
import { useCloseEvents } from "@/src/lib/shared/hooks/useCloseEvents";
import { Button } from "@/src/lib/shared/ui/Button";
import { SvgAchievement, SvgClose, SvgMore, SvgStar } from "@/src/lib/shared/ui/svg";
import Link from "next/link";
import { SvgCrown } from "@/src/lib/shared/ui/svg/SvgCrown";
import { useHideAdult } from "@/src/lib/shared/hooks/useHideAdult";
import { isAdultGame } from "@/src/lib/shared/utils/adult.utils";
import { GameControls } from "@/src/lib/widgets/game/GameControls";
import { modal } from "@/src/lib/shared/ui/Modal";
import { AchievementsModal } from "@/src/lib/shared/ui/AchievementsModal";
import { useAuthStore } from "@/src/lib/shared/store/auth.store";
import { playthroughPriorityOrder } from "@/src/lib/shared/constants/user.const";
import { getAverageRating } from "@/src/lib/shared/utils/rating.utils";
import { GameRatingPopover } from "@/src/lib/features/game/ui/GameRatingPopover";
import { useRoyalGames } from "@/src/lib/entities/royal/model/useRoyalGames";
import { Checkbox } from "@/src/lib/shared/ui/Checkbox";
import { EXPAND_KEEP_OPEN_ATTRIBUTE } from "@/src/lib/shared/ui/ExpandMenu";

interface IGameCardProps {
  game: IGameResponse;
  className?: string;
  style?: CSSProperties;
  spreadDirection?: "width" | "height";
  isInfoDisabled?: boolean;
  priority?: boolean;
  rank?: number;
  isWithCombinedRating?: boolean;
  isSelectable?: boolean;
  isSelected?: boolean;
  onSelect?: (gameId: string) => void;
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
    isSelectable,
    isSelected,
    onSelect,
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
    const { royalGames, addRoyalGame, removeRoyalGame } = useRoyalGames();
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
          isInfoDisabled && styles.wrapper_stacked,
          isSelectable && styles.wrapper_selectable
        )}
        style={style}
        ref={cardRef}
        {...(isSelectable && { [EXPAND_KEEP_OPEN_ATTRIBUTE]: "" })}
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
            isInfoDisabled && styles.card_stacked,
            isSelected && styles.card_selected
          )}
          draggable={false}
          onClick={
            isSelectable
              ? (event) => {
                  event.preventDefault();
                  onSelect?.(game._id);
                }
              : undefined
          }
        >
          {isSelectable && (
            <Checkbox
              className={styles.card__select}
              colorTheme="on"
              checked={!!isSelected}
              aria-label={
                isSelected ? `Deselect ${game.name}` : `Select ${game.name}`
              }
              onChange={() => onSelect?.(game._id)}
              onClick={(event) => event.stopPropagation()}
            />
          )}
          <div
            className={classNames(styles.card__rail, styles.card__rail_topLeft)}
          >
            {!!rank && <div className={styles.card__rank}>{rank}</div>}
            <Tooltip
              content={
                isRoyal ? "Remove from royal games" : "Add to royal games"
              }
            >
              <div
                role="button"
                aria-label={
                  isRoyal ? "Remove from royal games" : "Add to royal games"
                }
                className={classNames(styles.card__royal, {
                  [styles.card__royal_empty]: !isRoyal,
                })}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();

                  isRoyal ? removeRoyalGame(game._id) : addRoyalGame(game._id);
                }}
              >
                <SvgCrown
                  size="16"
                  color={isRoyal ? "contrast-reverse" : "secondary"}
                />
              </div>
            </Tooltip>
          </div>
          {!!profile?._id && (
            <div
              className={classNames(
                styles.card__rail,
                styles.card__rail_bottomLeft
              )}
              ref={ratingRef}
            >
              <Tooltip
                content={!!rating ? `Your rating: ${rating}` : "Rate the game"}
              >
                <div
                  role="button"
                  aria-label={
                    !!rating ? `Your rating: ${rating}` : "Rate the game"
                  }
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
              </Tooltip>
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
                <Tooltip
                  content={
                    isMastered
                      ? "RetroAchievements: mastered"
                      : isBeaten
                        ? "RetroAchievements: beaten"
                        : "RetroAchievements"
                  }
                >
                  <div
                    role="button"
                    aria-label="RetroAchievements"
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
                </Tooltip>
              )}
              {!!combinedRating && (
                <Tooltip content="Average of IGDB, HowLongToBeat and user ratings">
                  <div
                    aria-label={`Average rating: ${combinedRating}`}
                    className={styles.card__combined}
                  >
                    <SvgStar size="12" fillPercent={100} />
                    <span>{combinedRating}</span>
                  </div>
                </Tooltip>
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
                tooltip={isActive ? "Close" : "Game info"}
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
