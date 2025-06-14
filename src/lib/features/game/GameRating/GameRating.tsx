import { FC, useState } from "react";
import styles from "./GameRating.module.scss";
import { RangeSelector } from "@/src/lib/shared/ui/RangeSelector";
import { useAuthStore } from "@/src/lib/shared/store/auth.store";
import { IGDBGameMinimal } from "@/src/lib/shared/types/igdb";
import { userAPI } from "@/src/lib/shared/api";
import { toast } from "@/src/lib/shared/utils/toast";
import { WrapperTemplate } from "@/src/lib/shared/ui/WrapperTemplate";
import { useAsyncLoader } from "@/src/lib/shared/hooks/useAsyncLoader";
import { Loader } from "@/src/lib/shared/ui/Loader";

interface IGameRatingProps {
  game: IGDBGameMinimal;
  rating?: number;
}

export const GameRating: FC<IGameRatingProps> = ({ game, rating }) => {
  const { sync, isLoading } = useAsyncLoader();
  const { profile, setProfile } = useAuthStore();

  const [ratingValue, setRatingValue] = useState<number>();

  const changeHandler = (value: number) => {
    if (!value) return;
    if (!profile || value === ratingValue) return;

    sync(() =>
      userAPI[!!value ? "addGameRating" : "removeGameRating"](
        profile._id,
        game._id,
        value
      ).then((res) => {
        toast.success({
          description: `${
            !!value ? `Set rating - ${value}` : "Remove rating"
          } for ${game.name}`,
        });
        setProfile(res.data);
        setRatingValue(value);
      })
    );
  };

  return (
    <WrapperTemplate classNameContent={styles.rating}>
      {isLoading ? (
        <Loader type="propogate" />
      ) : (
        <RangeSelector
          finalCallback={changeHandler}
          text={
            !!ratingValue
              ? ratingValue.toString()
              : !!rating
                ? rating.toString()
                : "No rating"
          }
          min={0}
          max={10}
          defaultValue={ratingValue || rating}
          disabled={false}
        />
      )}
    </WrapperTemplate>
  );
};
