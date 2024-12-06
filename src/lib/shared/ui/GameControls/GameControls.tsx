import { CSSProperties, FC, useEffect, useRef, useState } from "react";
import styles from "./GameControls.module.scss";
import { IGDBGameMinimal } from "../../types/igdb";
import { Icon } from "@iconify/react";
import classNames from "classnames";
import { Button } from "../Button";
import { categoriesType } from "../../types/user.type";
import { userAPI } from "../../api";
import { useAuthStore } from "../../store/auth.store";
import { axiosUtils } from "../../utils/axios";
import { toast } from "../../utils/toast";
import useCloseEvents from "../../hooks/useCloseEvents";
import { RangeSelector } from "../RangeSelector";
import { accentColor } from "../../constants";

interface IGameControlsProps {
  style?: CSSProperties;
  className?: string;
  game: IGDBGameMinimal;
}

const getMoonPhase = (rating: number) => {
  switch (rating) {
    case 1:
      return "wi:moon-alt-waxing-gibbous-4";
    case 2:
      return "wi:moon-alt-waxing-gibbous-3";
    case 3:
      return "wi:moon-alt-waxing-gibbous-2";
    case 4:
      return "wi:moon-alt-waxing-gibbous-1";
    case 5:
      return "wi:moon-alt-first-quarter";
    case 6:
      return "wi:moon-alt-waxing-crescent-6";
    case 7:
      return "wi:moon-alt-waxing-crescent-4";
    case 8:
      return "wi:moon-alt-waxing-crescent-2";
    case 9:
      return "wi:moon-alt-waxing-crescent-1";
    case 10:
      return "wi:moon-alt-new";
    default:
      return "f7:moon-circle";
  }
};

export const GameControls: FC<IGameControlsProps> = ({
  game,
  className,
  style,
}) => {
  const { profile, setProfile } = useAuthStore();

  const ratingsRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<HTMLDivElement>(null);
  const ratingButtonRef = useRef<HTMLButtonElement>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isRatingActive, setIsRatingActive] = useState(false);
  const [isPlayedActive, setIsPlayedActive] = useState(false);
  const [isPauseActive, setIsPauseActive] = useState(false);

  const [ratingValue, setRatingValue] = useState(0);

  const addToList = (name: categoriesType) => {
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

  const removeFromList = (name: categoriesType) => {
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

  const isPlaying = profile?.games?.playing.some((id) => game._id === id);
  const isPlayed = profile?.games?.played.some((id) => game._id === id);
  const isMastered = profile?.games?.mastered.some((id) => game._id === id);
  const isCompleted = profile?.games?.completed.some((id) => game._id === id);
  const isWishlisted = profile?.games?.wishlist.some((id) => game._id === id);
  const isBacklogged = profile?.games?.backlog.some((id) => game._id === id);
  const isDropped = profile?.games?.dropped.some((id) => game._id === id);

  let rating = profile?.gamesRating?.find((rating) => rating.game === game._id);

  useCloseEvents([ratingsRef, ratingButtonRef], () => {
    setIsRatingActive(false);
  });

  useEffect(() => {
    !!rating && setRatingValue(rating.rating);
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
        {(["played", "completed", "mastered"] as categoriesType[]).map(
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
        {(["wishlist", "backlog", "dropped"] as categoriesType[]).map((key) => (
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
              ...profile.games.mastered,
              ...profile.games.played,
              ...profile.games.completed,
            ].some((id) => game._id === id),
        })}
      >
        <Icon
          className={classNames(styles.controls__icon, {
            [styles.controls__icon_active]:
              isCompleted || isPlayed || isMastered,
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
        ref={ratingButtonRef}
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
        <Icon
          className={classNames(styles.controls__heart, {
            [styles.controls__heart_active]: !!ratingValue,
          })}
          style={{
            filter: `drop-shadow(0 0 ${ratingValue * 0.05}rem ${accentColor})`,
          }}
          icon={getMoonPhase(ratingValue)}
        />
        <Icon
          className={classNames(styles.controls__number, {
            [styles.controls__number_active]: !!ratingValue,
          })}
          icon={`mdi:numeric-${ratingValue}`}
        />
      </Button>
    </div>
  );
};
