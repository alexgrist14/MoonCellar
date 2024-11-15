import { CSSProperties, FC, useRef, useState } from "react";
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
  const [hoverIndex, setHoverIndex] = useState<number>(-1);

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

  useCloseEvents([ratingsRef, ratingButtonRef], () => {
    setIsRatingActive(false);
  });

  return (
    <div
      className={classNames(styles.controls, className, {
        [styles.controls_disabled]: !profile || isLoading,
        [styles.controls_overflow]: isRatingActive,
      })}
      style={style}
      ref={controlsRef}
    >
      <div
        ref={ratingsRef}
        onMouseOut={() => setHoverIndex(-1)}
        style={{
          // bottom: `calc(${ratingButtonRef.current?.offsetHeight}px)`,
          right: `calc(-${ratingButtonRef.current?.offsetWidth}px)`,
          // height: `calc(${ratingButtonRef.current?.offsetHeight}px)`,
          width: `calc(${ratingButtonRef.current?.offsetWidth}px)`,
        }}
        className={classNames(styles.controls__ratings, {
          [styles.controls__ratings_active]: isRatingActive,
        })}
      >
        {Array(10)
          .fill("")
          .map((_, i) => (
            <div
              key={i}
              className={classNames(styles.controls__rating, {
                [styles.controls__rating_active]:
                  (!!rating && rating.rating >= i + 1) || i <= hoverIndex,
              })}
              onMouseOver={() => setHoverIndex(i)}
              onClick={() => {
                if (!profile) return;
                setIsRatingActive(false);

                !!rating && rating.rating === i + 1
                  ? userAPI
                      .removeGameRating(profile?._id, game._id)
                      .then((res) => {
                        toast.success({
                          content: "Rating was successfully removed",
                        });

                        setProfile(res.data);
                      })
                      .catch(axiosUtils.toastError)
                  : userAPI
                      .addGameRating(profile._id, game._id, i + 1)
                      .then((res) => {
                        toast.success({
                          content: `Game was successfully rated (${i + 1})`,
                        });

                        setProfile(res.data);
                      })
                      .catch(axiosUtils.toastError);
              }}
            >
              <Icon
                className={classNames(styles.controls__heart, {
                  [styles.controls__heart_active]:
                    !!rating && rating.rating >= i + 1,
                })}
                icon="f7:moon-circle"
              />
              <Icon
                className={classNames(styles.controls__number, {
                  [styles.controls__number_active]:
                    !!rating && rating.rating >= i + 1,
                })}
                icon={`mdi:numeric-${i + 1}`}
              />
            </div>
          ))}
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
        <Icon className={styles.controls__icon} icon="iconamoon:play-circle" />
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
          className={styles.controls__icon}
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
          className={styles.controls__icon}
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
          className={styles.controls__icon}
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
          [styles.controls__action_active]: !!rating,
        })}
      >
        <Icon
          className={classNames(styles.controls__heart, {
            [styles.controls__heart_active]: !!rating,
          })}
          icon="f7:moon-circle"
        />
        {!!rating?.rating && (
          <Icon
            className={classNames(styles.controls__number, {
              [styles.controls__number_active]: !!rating,
            })}
            icon={`mdi:numeric-${rating.rating}`}
          />
        )}
      </Button>
    </div>
  );
};
