import { CSSProperties, FC, memo, useMemo, useRef, useState } from "react";
import styles from "./GameCard.module.scss";
import classNames from "classnames";
import Image from "next/image";
import { Cover } from "@/src/lib/shared/ui/Cover";
import { Loader } from "@/src/lib/shared/ui/Loader";
import { useUserStore } from "@/src/lib/shared/store/user.store";
import { GameCardInfo } from "@/src/lib/widgets/game/GameCardInfo";
import { Tooltip } from "@/src/lib/shared/ui/Tooltip";
import { IGameResponse } from "@mooncellar/schemas";
import {
  SvgAchievement,
  SvgBookmark,
  SvgCheck,
  SvgClock,
  SvgClose,
  SvgFlag,
  SvgMore,
  SvgPlayTriangle,
  SvgPlus,
  SvgStar,
  SvgTrophy,
} from "@/src/lib/shared/ui/svg";
import { ISvgBaseProps } from "@/src/lib/shared/ui/svg/Svg/Svg";
import { CategoriesType } from "@/src/lib/shared/types/user.type";
import { commonUtils } from "@/src/lib/shared/utils/common.utils";
import Link from "next/link";
import { SvgCrown } from "@/src/lib/shared/ui/svg/SvgCrown";
import { useHideAdult } from "@/src/lib/shared/hooks/useHideAdult";
import { isAdultGame } from "@/src/lib/shared/utils/adult.utils";
import { GameControls } from "@/src/lib/widgets/game/GameControls";
import { modal } from "@/src/lib/shared/ui/Modal";
import {
  PLAYTHROUGH_MODAL_ID,
  PlaythroughModal,
} from "@/src/lib/features/game/ui/PlaythroughModal";
import { useAuthStore } from "@/src/lib/shared/store/auth.store";
import { playthroughPriorityOrder } from "@/src/lib/shared/constants/user.const";
import { getAverageRating } from "@/src/lib/shared/utils/rating.utils";
import { GameRatingPopover } from "@/src/lib/features/game/ui/GameRatingPopover";
import { GameAchievementsPopover } from "@/src/lib/features/game/ui/GameAchievementsPopover";
import { useRoyalGames } from "@/src/lib/entities/royal/model/useRoyalGames";
import { Checkbox } from "@/src/lib/shared/ui/Checkbox";
import { EXPAND_KEEP_OPEN_ATTRIBUTE } from "@/src/lib/shared/ui/ExpandMenu";

const STATUS_ICONS: Record<CategoriesType, FC<ISvgBaseProps>> = {
  wishlist: SvgBookmark,
  backlog: SvgClock,
  playing: SvgPlayTriangle,
  played: SvgCheck,
  completed: SvgFlag,
  mastered: SvgTrophy,
  dropped: SvgClose,
};

interface IGameCardProps {
  game: IGameResponse;
  className?: string;
  style?: CSSProperties;
  spreadDirection?: "width" | "height";
  isInfoDisabled?: boolean;
  priority?: boolean;
  rank?: number;
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
    isSelectable,
    isSelected,
    onSelect,
  }: IGameCardProps) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const ratingRef = useRef<HTMLDivElement>(null);
    const achievementsRef = useRef<HTMLDivElement>(null);

    const [isRatingOpen, setIsRatingOpen] = useState(false);
    const [isAchievementsOpen, setIsAchievementsOpen] = useState(false);

    const hideMedia = useHideAdult() && isAdultGame(game);

    const combinedRating = useMemo(() => getAverageRating(game), [game]);

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

    const status: CategoriesType | undefined = lastPlaythrough?.isMastered
      ? "mastered"
      : lastPlaythrough?.category;
    const StatusIcon = status && STATUS_ICONS[status];

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
            styles[`card_${status}`],
            isInfoDisabled && styles.card_stacked,
            isSelected && styles.card_selected
          )}
          draggable={false}
          data-prevent-progress={isSelectable ? "true" : undefined}
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
              onClick={(e) => {
                e.stopPropagation();
              }}
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
                data-prevent-progress
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
                  data-prevent-progress
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
              <Tooltip
                content={
                  status
                    ? `${commonUtils.upFL(status)} · Playthroughs`
                    : "Add a playthrough"
                }
              >
                <div
                  role="button"
                  aria-label={
                    status
                      ? `Status: ${status}. Open playthroughs`
                      : "Add a playthrough"
                  }
                  data-prevent-progress
                  className={classNames(
                    styles.card__status,
                    status
                      ? styles[`card__status_${status}`]
                      : styles.card__status_empty
                  )}
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();

                    modal.open(
                      <PlaythroughModal game={game} userId={profile._id} />,
                      { id: PLAYTHROUGH_MODAL_ID, isResizable: true }
                    );
                  }}
                >
                  {StatusIcon ? (
                    <StatusIcon size="16" style={{ color: "inherit" }} />
                  ) : (
                    <SvgPlus size="16" style={{ color: "inherit" }} />
                  )}
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
                    ref={achievementsRef}
                    aria-label="RetroAchievements"
                    aria-expanded={isAchievementsOpen}
                    className={styles.card__achievement}
                    data-prevent-progress
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();

                      setIsAchievementsOpen((current) => !current);
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
              <Tooltip content={isActive ? "Close" : "Game info"}>
                <button
                  type="button"
                  aria-label={isActive ? "Close" : "Game info"}
                  aria-expanded={isActive}
                  className={classNames(
                    styles.card__more,
                    isActive && styles[`card__more_${status}`]
                  )}
                  data-prevent-progress
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();

                    setIsActive(!isActive);
                  }}
                >
                  {isActive ? <SvgClose size="16" /> : <SvgMore />}
                </button>
              </Tooltip>
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
        {!!game.retroachievements?.length && (
          <GameAchievementsPopover
            game={game}
            anchorRef={achievementsRef}
            isOpen={isAchievementsOpen}
            onClose={() => setIsAchievementsOpen(false)}
          />
        )}
        {isInfoDisabled && (
          <GameControls game={game} className={styles.card__controls} />
        )}
      </div>
    );
  }
);

GameCard.displayName = "GameCard";
