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

interface IGameRatingProps {
  game: IGameResponse;
}

export const GameRating: FC<IGameRatingProps> = ({ game }) => {
  const { sync, isLoading } = useAsyncLoader();
  const { profile } = useAuthStore();
  const { setRatings, ratings } = useUserStore();

  const rating = useMemo(
    () => ratings?.find((rating) => rating.gameId === game._id),
    [game, ratings]
  );

  const [value, setValue] = useState(
    !!rating?.rating ? rating.rating.toString() : "No rating"
  );
  const [ratingValue, setRatingValue] = useState<number | undefined>();

  const changeHandler = (value: number) => {
    if (!profile || value === ratingValue || !ratings) return;

    if (!value && !!rating) {
      sync(() =>
        ratingsAPI.remove({ _id: rating._id, userId: profile._id }).then(() => {
          toast.success({
            description: `${"Rating removed"} for ${game.name}`,
          });

          setRatings(ratings.filter((r) => r._id !== rating._id));
          setRatingValue(value);
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
    <WrapperTemplate classNameContent={styles.rating}>
      <RangeSelector
        callback={(value) =>
          setValue(!!value ? value?.toString() : "No rating")
        }
        finalCallback={changeHandler}
        text={value}
        min={0}
        max={10}
        defaultValue={ratingValue || rating?.rating || 0}
        disabled={false}
        isLoading={isLoading}
      />
    </WrapperTemplate>
  );
};
