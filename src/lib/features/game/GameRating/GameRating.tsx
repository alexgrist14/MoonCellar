import { FC, useMemo, useState } from "react";
import styles from "./GameRating.module.scss";
import { RangeSelector } from "@/src/lib/shared/ui/RangeSelector";
import { useAuthStore } from "@/src/lib/shared/store/auth.store";
import { toast } from "@/src/lib/shared/utils/toast.utils";
import { WrapperTemplate } from "@/src/lib/shared/ui/WrapperTemplate";
import { useAsyncLoader } from "@/src/lib/shared/hooks/useAsyncLoader";
import { IGameResponse } from "@/src/lib/shared/lib/schemas/games.schema";
import { ratingsAPI } from "@/src/lib/shared/api/ratings.api";
import { useUserStore } from "@/src/lib/shared/store/user.store";
import { Icon } from "@iconify/react";
import { accentColorRGB } from "@/src/lib/shared/constants";
import classNames from "classnames";
import { Loader } from "@/src/lib/shared/ui/Loader";

interface IGameRatingProps {
  game: IGameResponse;
  isDisabled?: boolean;
}

export const GameRating: FC<IGameRatingProps> = ({ game, isDisabled }) => {
  const { sync, isLoading } = useAsyncLoader();
  const { profile } = useAuthStore();
  const { setRatings, ratings } = useUserStore();

  const rating = useMemo(
    () => ratings?.find((rating) => rating.gameId === game._id),
    [game, ratings]
  );
  const [ratingValue, setRatingValue] = useState<number | undefined>();
  const [hoverIndex, setHoverIndex] = useState<number | undefined>();

  const changeHandler = (value: number) => {
    if (!profile || !ratings) return;

    if (value === rating?.rating && !!rating) {
      sync(() =>
        ratingsAPI.remove({ _id: rating._id, userId: profile._id }).then(() => {
          toast.success({
            description: `${"Rating removed"} for ${game.name}`,
          });

          setRatings(ratings.filter((r) => r._id !== rating._id));
          setRatingValue(undefined);
        })
      );
    } else if (!!value && !rating) {
      sync(() =>
        ratingsAPI
          .add({ gameId: game._id, rating: value, userId: profile._id })
          .then((res) => {
            toast.success({
              description: `${`Set rating - ${value}`} for ${game.name}`,
            });

            setRatings([...ratings, res.data]);
            setRatingValue(value);
          })
      );
    } else if (!!value && rating) {
      sync(() =>
        ratingsAPI
          .update({ _id: rating._id, userId: profile._id, rating: value })
          .then((res) => {
            toast.success({
              description: `${`Update rating to ${value}`} for ${game.name}`,
            });

            setRatings(
              ratings.map((r) => (r._id === rating._id ? res.data : r))
            );
            setRatingValue(value);
          })
      );
    }
  };

  return (
    <div
      className={classNames(styles.rating, {
        [styles.rating_loading]: isLoading || isDisabled,
      })}
      onMouseLeave={() => setHoverIndex(undefined)}
      inert={isDisabled}
    >
      {isLoading && <Loader className={styles.rating__loader} type="pulse" />}
      {Array(10)
        .fill("")
        .map((_, index) => (
          <Icon
            key={index}
            className={classNames(styles.rating__number, {
              [styles.rating__number_active]:
                (hoverIndex === undefined &&
                  ratingValue !== undefined &&
                  ratingValue >= index + 1) ||
                (hoverIndex === undefined &&
                  rating &&
                  rating.rating !== null &&
                  rating.rating >= index + 1) ||
                (hoverIndex !== undefined && hoverIndex >= index),
            })}
            onClick={() => changeHandler(index + 1)}
            onMouseOver={() => setHoverIndex(index)}
            icon={`mdi:numeric-${index + 1}`}
          />
        ))}
    </div>
  );
};
