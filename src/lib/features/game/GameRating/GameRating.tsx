import { FC, useState } from "react";
import styles from "./GameRating.module.scss";
import { RangeSelector } from "@/src/lib/shared/ui/RangeSelector";
import { useAuthStore } from "@/src/lib/shared/store/auth.store";
import { IGDBGameMinimal } from "@/src/lib/shared/types/igdb.type";
import { userAPI } from "@/src/lib/shared/api";
import { toast } from "@/src/lib/shared/utils/toast.utils";
import { WrapperTemplate } from "@/src/lib/shared/ui/WrapperTemplate";
import { useAsyncLoader } from "@/src/lib/shared/hooks/useAsyncLoader";

interface IGameRatingProps {
  game: IGDBGameMinimal;
  rating?: number;
}

export const GameRating: FC<IGameRatingProps> = ({ game, rating }) => {
  const { sync, isLoading } = useAsyncLoader();
  const { profile, setProfile } = useAuthStore();

  const [value, setValue] = useState(
    !!rating ? rating.toString() : "No rating"
  );
  const [ratingValue, setRatingValue] = useState<number | undefined>();

  const changeHandler = (value: number) => {
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
      <RangeSelector
        callback={(value) =>
          setValue(!!value ? value?.toString() : "No rating")
        }
        finalCallback={changeHandler}
        text={value}
        min={0}
        max={10}
        defaultValue={ratingValue || rating}
        disabled={false}
        isLoading={isLoading}
      />
    </WrapperTemplate>
  );
};
