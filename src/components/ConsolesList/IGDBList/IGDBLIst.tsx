import { FC, useEffect, useState } from "react";
import styles from "./IGDBList.module.scss";
import Range from "@atlaskit/range";
import { useDebouncedCallback } from "use-debounce";
import { useAppDispatch, useAppSelector } from "../../../store";
import Checkbox from "@atlaskit/checkbox";
import {
  setSelectedGameModes,
  setSelectedGeneration,
  setSelectedGenres,
  setSelectedRating,
  setSelectedSystemsIGDB,
} from "../../../store/selectedSlice";
import { setExcludedGenres } from "../../../store/excludedSlice";
import classNames from "classnames";

const IGDBList: FC = () => {
  const dispatch = useAppDispatch();

  const [selectedRatingWithoutDebounce, setSelectedRatingWithoutDebounce] =
    useState<number>(0);

  const [
    selectedGenerationWithoutDebounce,
    setSelectedGenerationWithoutDebounce,
  ] = useState<number>(0);

  const { gameModes, genres, systemsIGDB } = useAppSelector(
    (state) => state.common
  );

  const {
    selectedSystemsIGDB,
    selectedGenres,
    selectedGameModes,
    selectedGeneration,
    selectedRating,
  } = useAppSelector((state) => state.selected);

  const { excludedGenres } = useAppSelector((state) => state.excluded);

  const { isLoading } = useAppSelector((state) => state.states);

  const debouncedSetGeneration = useDebouncedCallback(
    (number: number) => dispatch(setSelectedGeneration(number)),
    500
  );

  const debouncedSetRating = useDebouncedCallback(
    (number: number) => dispatch(setSelectedRating(number)),
    500
  );

  useEffect(() => {
    setSelectedRatingWithoutDebounce(selectedRating);
    setSelectedGenerationWithoutDebounce(selectedGeneration);
  }, [selectedRating, selectedGeneration]);

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
      <h3>Game Modes</h3>
      <div className={styles.consoles__platforms}>
        {gameModes.map((mode) => (
          <Checkbox
            key={mode.id}
            label={mode.name}
            isChecked={selectedGameModes?.some((gm) => gm.id === mode.id)}
            isDisabled={isLoading}
            onChange={() =>
              dispatch(
                setSelectedGameModes(
                  !!selectedGameModes?.length
                    ? !selectedGameModes?.some((gm) => gm.id === mode.id)
                      ? [...selectedGameModes, mode]
                      : selectedGameModes.filter((gm) => gm.id !== mode.id)
                    : [mode]
                )
              )
            }
          />
        ))}
      </div>
      <h3>Genres</h3>
      <div className={styles.consoles__families}>
        {genres.map((genre) => {
          const isExcluded = excludedGenres?.some(
            (excluded) => excluded.id === genre.id
          );

          const isSelected = selectedGenres?.some(
            (selected) => selected.id === genre.id
          );

          return (
            <Checkbox
              key={genre.id}
              label={genre.name}
              isChecked={isSelected || isExcluded}
              isIndeterminate={isExcluded}
              isDisabled={isLoading}
              onChange={() => {
                if (isSelected) {
                  dispatch(
                    setExcludedGenres([
                      ...(!!excludedGenres ? excludedGenres : []),
                      genre,
                    ])
                  );
                  dispatch(
                    setSelectedGenres(
                      selectedGenres?.filter(
                        (selected) => selected.id !== genre.id
                      )
                    )
                  );
                } else if (isExcluded) {
                  dispatch(
                    setExcludedGenres(
                      excludedGenres?.filter(
                        (excluded) => excluded.id !== genre.id
                      )
                    )
                  );
                } else {
                  dispatch(
                    setSelectedGenres([
                      ...(!!selectedGenres ? selectedGenres : []),
                      genre,
                    ])
                  );
                }
              }}
            />
          );
        })}
      </div>
      <h3>Platforms</h3>
      <div className={styles.consoles__platforms}>
        {systemsIGDB.map((platform) => (
          <Checkbox
            key={platform.id}
            label={platform.name}
            isChecked={selectedSystemsIGDB?.some(
              (system) => system.id === platform.id
            )}
            isDisabled={isLoading}
            onChange={() =>
              dispatch(
                setSelectedSystemsIGDB(
                  !!selectedSystemsIGDB?.length
                    ? !selectedSystemsIGDB?.some(
                        (system) => system.id === platform.id
                      )
                      ? [...selectedSystemsIGDB, platform]
                      : selectedSystemsIGDB.filter(
                          (system) => system.id !== platform.id
                        )
                    : [platform]
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
