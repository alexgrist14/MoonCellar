import { CSSProperties, FC, useEffect, useRef, useState } from "react";
import styles from "./GameControls.module.scss";
import { IGDBGame } from "../../types/igdb";
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
  game: IGDBGame;
  isWithoutTooltips?: boolean;
}

export const GameControls: FC<IGameControlsProps> = ({
  game,
  className,
  style,
  isWithoutTooltips,
}) => {
  const { profile, setProfile } = useAuthStore();

  const ratingsRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<HTMLDivElement>(null);
  const ratingButtonRef = useRef<HTMLButtonElement>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isRatingActive, setIsRatingActive] = useState(false);
  const [isListsActive, setIsListsActive] = useState(false);

  const [ratingValue, setRatingValue] = useState(0);

  const addToList = (name: categoriesType) => {
    if (!profile) return;
    setIsLoading(true);

    return userAPI
      .addGameToCategory(profile._id, game._id, name)
      .then((res) => {
        setProfile(res.data);

        setIsLoading(false);
        toast.success({ content: `Game successfully added to ${name}` });
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
        toast.success({ content: `Game successfully removed from ${name}` });
      })
      .catch(axiosUtils.toastError);
  };

  const isPlayed = profile?.games?.playing.some((id) => game._id === id);
  const isCompleted = profile?.games?.completed.some((id) => game._id === id);
  const isWishlisted = profile?.games?.wishlist.some((id) => game._id === id);
  const isBacklogged = profile?.games?.backlog.some((id) => game._id === id);
  const isDropped = profile?.games?.dropped.some((id) => game._id === id);

  let rating = profile?.gamesRating?.find((rating) => rating.game === game._id);

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

  useCloseEvents([ratingsRef, ratingButtonRef], () => {
    setIsRatingActive(false);
  });

  useEffect(() => {
    !!rating && setRatingValue(rating.rating);
  }, [rating]);

  return (
    <div
      className={classNames(styles.controls, className, {
        [styles.controls_disabled]: !profile || isLoading,
      })}
      style={style}
      ref={controlsRef}
    >
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
            finalCallback={(value) =>
              !!profile &&
              value !== rating?.rating &&
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
                .catch(axiosUtils.toastError)
            }
            text={!!ratingValue ? ratingValue.toString() : "No rating"}
            min={0}
            max={10}
            defaultValue={ratingValue || rating?.rating}
            disabled={false}
          />
        }
      </div>
      <Button
        onClick={() =>
          isPlayed ? removeFromList("playing") : addToList("playing")
        }
        color="transparent"
        tooltip={
          isWithoutTooltips
            ? undefined
            : `${isPlayed ? "Remove from" : "Add to"} playing`
        }
        className={classNames(styles.controls__action, {
          [styles.controls__action_active]: isPlayed,
        })}
      >
        <Icon
          className={classNames(styles.controls__icon, {
            [styles.controls__icon_active]: isPlayed,
          })}
          icon="iconamoon:play-circle"
        />
      </Button>
      <Button
        onClick={() =>
          isCompleted ? removeFromList("completed") : addToList("completed")
        }
        color="transparent"
        tooltip={
          isWithoutTooltips
            ? undefined
            : `${isCompleted ? "Remove from" : "Add to"} completed`
        }
        className={classNames(styles.controls__action, {
          [styles.controls__action_active]: profile?.games?.completed.some(
            (id) => game._id === id
          ),
        })}
      >
        <Icon
          className={classNames(styles.controls__icon, {
            [styles.controls__icon_active]: isCompleted,
          })}
          icon="iconamoon:check-circle-1"
        />
      </Button>
      <Button
        onClick={() =>
          isWishlisted ? removeFromList("wishlist") : addToList("wishlist")
        }
        color="transparent"
        tooltip={
          isWithoutTooltips
            ? undefined
            : `${isWishlisted ? "Remove from" : "Add to"} wishlist`
        }
        className={classNames(styles.controls__action, {
          [styles.controls__action_active]: profile?.games?.wishlist.some(
            (id) => game._id === id
          ),
        })}
      >
        <Icon
          className={classNames(styles.controls__icon, {
            [styles.controls__icon_active]: isWishlisted,
          })}
          icon="iconamoon:sign-plus-circle"
        />
      </Button>
      <Button
        onClick={() =>
          isBacklogged ? removeFromList("backlog") : addToList("backlog")
        }
        color="transparent"
        tooltip={
          isWithoutTooltips
            ? undefined
            : `${isBacklogged ? "Remove from" : "Add to"} backlog`
        }
        className={classNames(styles.controls__action, {
          [styles.controls__action_active]: profile?.games?.backlog.some(
            (id) => game._id === id
          ),
        })}
      >
        <Icon
          className={classNames(styles.controls__icon, {
            [styles.controls__icon_active]: isBacklogged,
          })}
          icon="iconamoon:menu-kebab-horizontal-circle"
        />
      </Button>
      <Button
        onClick={() =>
          isDropped ? removeFromList("dropped") : addToList("dropped")
        }
        color="transparent"
        tooltip={
          isWithoutTooltips
            ? undefined
            : `${isDropped ? "Remove from" : "Add to"} dropped`
        }
        className={classNames(styles.controls__action, {
          [styles.controls__action_active]: isDropped,
        })}
      >
        <Icon
          className={classNames(styles.controls__icon, {
            [styles.controls__icon_active]: isDropped,
          })}
          icon="iconamoon:close-circle-1"
        />
      </Button>
      <Button
        ref={ratingButtonRef}
        onClick={() => {
          setIsRatingActive(!isRatingActive);
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
