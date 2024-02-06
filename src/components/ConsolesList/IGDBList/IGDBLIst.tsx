import { Dispatch, FC, SetStateAction, useState } from "react";
import styles from "./IGDBList.module.scss";
import Range from "@atlaskit/range";
import { useDebouncedCallback } from "use-debounce";
import { useAppDispatch, useAppSelector } from "../../../store";
import { IIGDBGenre, IIGDBPlatform } from "../../../interfaces";
import Checkbox from "@atlaskit/checkbox";
import { setSystemsIGDB } from "../../../store/commonSlice";

interface IGDBListProps {
  setSelectedGeneration: Dispatch<SetStateAction<number>>;
  selectedRating: number;
  setSelectedRating: Dispatch<SetStateAction<number>>;
  selectedGeneration: number;
  selectedGenres: number[];
  setSelectedGenres: Dispatch<SetStateAction<number[]>>;
  IGDBPlatforms: IIGDBPlatform[];
  IGDBGenres: IIGDBGenre[];
}

const IGDBList: FC<IGDBListProps> = ({
  setSelectedGeneration,
  selectedRating,
  setSelectedRating,
  selectedGeneration,
  selectedGenres,
  setSelectedGenres,
  IGDBPlatforms,
  IGDBGenres,
}) => {
  const [selectedRatingWithoutDebounce, setSelectedRatingWithoutDebounce] =
    useState<number>(0);
  const [
    selectedGenerationWithoutDebounce,
    setSelectedGenerationWithoutDebounce,
  ] = useState<number>(0);

  const { systemsIGDB } = useAppSelector((state) => state.common);

  const dispatch = useAppDispatch();

  const { isLoading } = useAppSelector((state) => state.states);

  const debouncedSetGeneration = useDebouncedCallback(
    (number: number) => setSelectedGeneration(number),
    500
  );

  const debouncedSetRating = useDebouncedCallback(
    (number: number) => setSelectedRating(number),
    500
  );

  return (
    <div className={styles.consoles__igdb}>
      <h3>Rating</h3>
      <div className={styles.consoles__generations}>
        <Range
          defaultValue={selectedRating}
          min={0}
          max={99}
          step={1}
          type="range"
          onChange={(value) => {
            debouncedSetRating(value);
            setSelectedRatingWithoutDebounce(value);
          }}
          isDisabled={isLoading}
        />
        <span>
          {!!selectedRatingWithoutDebounce
            ? ">= " + selectedRatingWithoutDebounce
            : "All"}
        </span>
      </div>
      <h3>Generations</h3>
      <div className={styles.consoles__generations}>
        <Range
          defaultValue={selectedGeneration}
          min={0}
          max={9}
          type="range"
          onChange={(value) => {
            debouncedSetGeneration(value);
            setSelectedGenerationWithoutDebounce(value);
          }}
          isDisabled={isLoading}
        />
        <span>
          {!!selectedGenerationWithoutDebounce
            ? "0 - " + selectedGenerationWithoutDebounce
            : "All"}
        </span>
      </div>
      <h3>Genres</h3>
      <div className={styles.consoles__families}>
        {IGDBGenres.map((genre) => (
          <Checkbox
            key={genre.id}
            label={genre.name}
            isChecked={selectedGenres.includes(genre.id)}
            isDisabled={isLoading}
            onChange={() =>
              setSelectedGenres(
                !selectedGenres.includes(genre.id)
                  ? [...selectedGenres, genre.id]
                  : selectedGenres.filter((id) => id !== genre.id)
              )
            }
          />
        ))}
      </div>
      <h3>Platforms</h3>
      <div className={styles.consoles__platforms}>
        {IGDBPlatforms.map((platform) => (
          <Checkbox
            key={platform.id}
            label={platform.name}
            isChecked={systemsIGDB?.includes(platform.id)}
            isDisabled={isLoading}
            onChange={() =>
              dispatch(
                setSystemsIGDB(
                  !!systemsIGDB?.length
                    ? !systemsIGDB?.includes(platform.id)
                      ? [...systemsIGDB, platform.id]
                      : systemsIGDB.filter((id) => id !== platform.id)
                    : [platform.id]
                )
              )
            }
          />
        ))}
      </div>
    </div>
  );
};

export default IGDBList;
