import { FC, useMemo, useState } from "react";
import styles from "./GameRating.module.scss";
import { RangeSelector } from "@/src/lib/shared/ui/RangeSelector";
import { useAuthStore } from "@/src/lib/shared/store/auth.store";
import { toast } from "@/src/lib/shared/utils/toast.utils";
import { Box } from "@/src/lib/shared/ui/Box";
import { useAsyncLoader } from "@/src/lib/shared/hooks/useAsyncLoader";
import { IGameResponse } from "@mooncellar/schemas";
import { ratingsAPI } from "@/src/lib/shared/api/ratings.api";
import { useUserStore } from "@/src/lib/shared/store/user.store";
import { SvgNumber } from "@/src/lib/shared/ui/svg";
import classNames from "classnames";
import { Loader } from "@/src/lib/shared/ui/Loader";
import { useRatingsQuery } from "@/src/lib/entities/rating/api/rating.queries";
import {
  useCreateRatingMutation,
  useDeleteRatingMutation,
  useUpdateRatingMutation,
} from "@/src/lib/entities/rating/api/rating.mutations";

interface IGameRatingProps {
  game: IGameResponse;
  className?: string;
}

export const GameRating: FC<IGameRatingProps> = ({ game, className }) => {
  const { profile } = useAuthStore();

  const { data: ratings, isPending } = useRatingsQuery(profile?._id ?? "");
  const { mutate: createRating, isPending: isCreating } =
    useCreateRatingMutation();
  const { mutate: updateRating, isPending: isUpdating } =
    useUpdateRatingMutation();
  const { mutate: deleteRating, isPending: isDeleting } =
    useDeleteRatingMutation();

  const rating = useMemo(
    () => ratings?.find((rating) => rating.gameId === game._id),
    [game, ratings]
  );
  const [hoverIndex, setHoverIndex] = useState<number | undefined>();

  const changeHandler = (value: number) => {
    if (!profile || !ratings) return;

    if (value === rating?.rating && !!rating) {
      deleteRating(
        { ratingId: rating._id, userId: profile._id },
        {
          onSuccess: () => {
            toast.success({
              description: `${`Removed rating`} for ${game.name}`,
            });
          },
        }
      );
    } else if (!!value && !rating) {
      createRating(
        { gameId: game._id, rating: value, userId: profile._id },
        {
          onSuccess: () => {
            toast.success({
              description: `${`Set rating - ${value}`} for ${game.name}`,
            });
          },
        }
      );
    } else if (!!value && rating) {
      updateRating(
        { _id: rating._id, userId: profile._id, rating: value },
        {
          onSuccess: () => {
            toast.success({
              description: `${`Updated rating to ${value}`} for ${game.name}`,
            });
          },
        }
      );
    }
  };
  const isLoading =
    (!!profile && isPending) || isCreating || isUpdating || isDeleting;

  const currentRating = rating?.rating ?? undefined;

  return (
    <div className={classNames(styles.rating, className)}>
      <div className={styles.rating__head}>
        <p className={styles.rating__label}>Your rating</p>
        <p
          className={classNames(styles.rating__value, {
            [styles.rating__value_empty]: currentRating === undefined,
          })}
        >
          {currentRating === undefined ? "Not rated" : `${currentRating} / 10`}
        </p>
      </div>
      <div
        className={classNames(styles.rating__scale, {
          [styles.rating__scale_loading]: isLoading,
        })}
        onMouseLeave={() => setHoverIndex(undefined)}
      >
        {isLoading && <Loader className={styles.rating__loader} type="pulse" />}
        {Array(10)
          .fill("")
          .map((_, index) => (
            <SvgNumber
              key={index}
              value={index + 1}
              className={classNames(styles.rating__number, {
                [styles.rating__number_active]:
                  hoverIndex === undefined &&
                  currentRating !== undefined &&
                  currentRating >= index + 1,
                [styles.rating__number_hovered]:
                  hoverIndex !== undefined && hoverIndex >= index,
              })}
              onClick={() => changeHandler(index + 1)}
              onMouseOver={() => setHoverIndex(index)}
            />
          ))}
      </div>
      <p className={styles.rating__hint}>
        {currentRating === undefined
          ? "Pick a number to rate"
          : "Pick the same number to remove it"}
      </p>
    </div>
  );
};
