import { CSSProperties, FC, useEffect, useMemo, useRef, useState } from "react";
import styles from "./GameControls.module.scss";
import { IGDBGameMinimal } from "../../types/igdb";
import { Icon } from "@iconify/react";
import classNames from "classnames";
import { Button } from "../Button";
import { CategoriesType } from "../../types/user.type";
import { userAPI } from "../../api";
import { useAuthStore } from "../../store/auth.store";
import { axiosUtils } from "../../utils/axios";
import { toast } from "../../utils/toast";
import useCloseEvents from "../../hooks/useCloseEvents";
import { RangeSelector } from "../RangeSelector";
import { accentColor, accentColorRGB } from "../../constants";
import { useGamesStore } from "../../store/games.store";

interface IGameControlsProps {
  style?: CSSProperties;
  className?: string;
  game: IGDBGameMinimal;
}

export const GameControls: FC<IGameControlsProps> = ({
  game,
  className,
  style,
}) => {
  const { profile, setProfile } = useAuthStore();
  const { royalGames, addRoyalGame, removeRoyalGame } = useGamesStore();

  const ratingsRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<HTMLDivElement>(null);
  const ratingButtonRef = useRef<HTMLButtonElement>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isRatingActive, setIsRatingActive] = useState(false);
  const [isPlayedActive, setIsPlayedActive] = useState(false);
  const [isPauseActive, setIsPauseActive] = useState(false);

  const [ratingValue, setRatingValue] = useState(0);

  const addToList = (name: CategoriesType) => {
    if (!profile) return;
    setIsLoading(true);

    return userAPI
      .addGameToCategory(profile._id, game._id, name)
      .then((res) => {
        setProfile(res.data);

        setIsLoading(false);
        toast.success({
          description: `${game.name} successfully added to ${name}`,
        });
      })
      .catch(axiosUtils.toastError);
  };

  const removeFromList = (name: CategoriesType) => {
    if (!profile) return;
    setIsLoading(true);

    return userAPI
      .removeGameFromCategory(profile._id, game._id, name)
      .then((res) => {
        setProfile(res.data);

        setIsLoading(false);
        toast.success({
          description: `${game.name} successfully removed from ${name}`,
        });
      })
      .catch(axiosUtils.toastError);
  };

  const {
    isPlaying,
    isPlayed,
    // isMastered,
    isCompleted,
    isWishlisted,
    isBacklogged,
    isDropped,
  } = useMemo(() => {
    const isPlaying = profile?.games?.playing.some((id) => game._id === id);
    const isPlayed = profile?.games?.played.some((id) => game._id === id);
    // const isMastered = profile?.games?.mastered.some((id) => game._id === id);
    const isCompleted = profile?.games?.completed.some((id) => game._id === id);
    const isWishlisted = profile?.games?.wishlist.some((id) => game._id === id);
    const isBacklogged = profile?.games?.backlog.some((id) => game._id === id);
    const isDropped = profile?.games?.dropped.some((id) => game._id === id);
    return {
      isPlaying,
      isPlayed,
      // isMastered,
      isCompleted,
      isWishlisted,
      isBacklogged,
      isDropped,
    };
  }, [profile, game]);

  const rating = useMemo(
    () => profile?.gamesRating?.find((rating) => rating.game === game._id),
    [game, profile]
  );

  const isRoyal = useMemo(
    () => royalGames?.some((royal) => royal._id === game?._id),
    [game, royalGames]
  );

  useCloseEvents([controlsRef], () => {
    setIsRatingActive(false);
    setIsPauseActive(false);
    setIsPlayedActive(false);
  });

  useEffect(() => {
    setRatingValue(!!rating ? rating.rating : 0);
  }, [rating]);

  return (
    <div
      className={classNames(styles.controls, className, {
        [styles.controls_disabled]: isLoading,
        [styles.controls_hidden]: !profile,
      })}
      style={style}
      ref={controlsRef}
    >
      <div
        style={{
          bottom: `calc(${ratingButtonRef.current?.offsetHeight}px)`,
        }}
        className={classNames(styles.controls__list, {
          [styles.controls__list_active]: isPlayedActive,
        })}
      >
        {(["played", "completed", "mastered"] as CategoriesType[]).map(
          (key) => (
            <Button
              key={key}
              active={profile?.games?.[key].some((id) => game._id === id)}
              onClick={() =>
                profile?.games?.[key].some((id) => game._id === id)
                  ? removeFromList(key)
                  : addToList(key)
              }
            >
              {profile?.games?.[key].some((id) => game._id === id)
                ? "Remove from"
                : "Add to"}{" "}
              {key}
            </Button>
          )
        )}
      </div>
      <div
        style={{
          bottom: `calc(${ratingButtonRef.current?.offsetHeight}px)`,
        }}
        className={classNames(styles.controls__list, {
          [styles.controls__list_active]: isPauseActive,
        })}
      >
        {(["wishlist", "backlog", "dropped"] as CategoriesType[]).map((key) => (
          <Button
            key={key}
            active={profile?.games?.[key].some((id) => game._id === id)}
            onClick={() =>
              profile?.games?.[key].some((id) => game._id === id)
                ? removeFromList(key)
                : addToList(key)
            }
          >
            {profile?.games?.[key].some((id) => game._id === id)
              ? "Remove from"
              : "Add to"}{" "}
            {key}
          </Button>
        ))}
      </div>
      <div
        ref={ratingsRef}
        style={{
          bottom: `calc(${ratingButtonRef.current?.offsetHeight}px)`,
        }}
        className={classNames(styles.controls__ratings, {
          [styles.controls__ratings_active]: isRatingActive,
        })}
      >
        {
          <RangeSelector
            callback={(value) => setRatingValue(value)}
            finalCallback={(value) => {
              if (!rating?.rating && !value) return;
              if (!profile || value === rating?.rating) return;

              userAPI[!!value ? "addGameRating" : "removeGameRating"](
                profile._id,
                game._id,
                value
              )
                .then((res) => {
                  toast.success({
                    description: `${
                      !!value ? `Set rating - ${value}` : "Remove rating"
                    } for ${game.name}`,
                  });
                  setProfile(res.data);
                })
                .catch(axiosUtils.toastError);
            }}
            text={!!ratingValue ? ratingValue.toString() : "No rating"}
            min={0}
            max={10}
            defaultValue={ratingValue || rating?.rating}
            disabled={false}
          />
        }
      </div>
      <Button
        onClick={() => {
          setIsPauseActive(false);
          setIsPlayedActive(false);
          setIsRatingActive(false);

          isPlaying ? removeFromList("playing") : addToList("playing");
        }}
        color="transparent"
        tooltip={(isPlaying ? "Remove from" : "Add to") + " playing"}
        tooltipAlign="left"
        className={classNames(styles.controls__action, {
          [styles.controls__action_active]: isPlaying,
        })}
      >
        <Icon
          className={classNames(styles.controls__icon, {
            [styles.controls__icon_active]: isPlaying,
          })}
          icon="iconamoon:play-circle"
        />
      </Button>
      <Button
        onClick={() => {
          setIsPlayedActive(!isPlayedActive);
          setIsPauseActive(false);
          setIsRatingActive(false);
        }}
        color="transparent"
        className={classNames(styles.controls__action, {
          [styles.controls__action_active]:
            !!profile?.games &&
            [
              // ...profile.games.mastered,
              ...profile.games.played,
              ...profile.games.completed,
            ].some((id) => game._id === id),
        })}
      >
        <Icon
          className={classNames(styles.controls__icon, {
            [styles.controls__icon_active]: isCompleted || isPlayed,
          })}
          icon="iconamoon:check-circle-1"
        />
      </Button>
      <Button
        onClick={() => {
          setIsPauseActive(!isPauseActive);
          setIsPlayedActive(false);
          setIsRatingActive(false);
        }}
        color="transparent"
        className={classNames(styles.controls__action, {
          [styles.controls__action_active]:
            !!profile?.games &&
            [
              ...profile.games.wishlist,
              ...profile.games.backlog,
              ...profile.games.dropped,
            ].some((id) => game._id === id),
        })}
      >
        <Icon
          className={classNames(styles.controls__icon, {
            [styles.controls__icon_active]:
              isDropped || isWishlisted || isBacklogged,
          })}
          icon="iconamoon:menu-kebab-horizontal-circle"
        />
      </Button>
      <Button
        onClick={() => (isRoyal ? removeRoyalGame(game) : addRoyalGame(game))}
        tooltip={(isRoyal ? "Remove from" : "Add to") + " royal games"}
        color="transparent"
        className={classNames(styles.controls__action, {
          [styles.controls__action_active]: isRoyal,
        })}
      >
        <Icon
          className={classNames(styles.controls__icon, {
            [styles.controls__icon_active]: isRoyal,
          })}
          icon="icon-park-outline:crown-two"
        />
      </Button>
      <Button
        ref={ratingButtonRef}
        tooltip={"Set rating"}
        tooltipAlign="right"
        onClick={() => {
          setIsRatingActive(!isRatingActive);
          setIsPauseActive(false);
          setIsPlayedActive(false);
        }}
        color="transparent"
        className={classNames(styles.controls__action, {
          [styles.controls__action_active]: !!ratingValue || isRatingActive,
        })}
      >
        {!ratingValue ? (
          <Icon
            className={classNames(styles.controls__icon)}
            icon={"tabler:moon-stars"}
          />
        ) : (
          <Icon
            style={{
              filter: `drop-shadow(0 0 ${ratingValue * 0.05}rem ${accentColor})`,
              backgroundColor: `rgba(${accentColorRGB}, ${ratingValue * 0.1})`,
            }}
            className={classNames(styles.controls__number)}
            icon={`mdi:numeric-${ratingValue}`}
          />
        )}
      </Button>
    </div>
  );
};
