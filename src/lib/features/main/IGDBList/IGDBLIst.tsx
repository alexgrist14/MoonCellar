import { FC } from "react";
import styles from "./IGDBList.module.scss";
import { useAppDispatch, useAppSelector } from "@/src/lib/app/store";
import { ExtendedSelector } from "@/src/lib/shared/ui/ExtendedSelector";
import { ExtendedRange } from "@/src/lib/shared/ui/ExtendedRange";
import {
  setSearchQuery,
  setSelectedGameModes,
  setSelectedGenres,
  setSelectedRating,
  setSelectedSystemsIGDB,
} from "@/src/lib/app/store/slices/selectedSlice";
import {
  setExcludedGameModes,
  setExcludedGenres,
  setExcludedSystems,
} from "@/src/lib/app/store/slices/excludedSlice";

export const IGDBList: FC = () => {
  const dispatch = useAppDispatch();
  const { gameModes, genres, systemsIGDB } = useAppSelector(
    (state) => state.common
  );

  const {
    selectedSystemsIGDB,
    selectedGenres,
    selectedGameModes,
    selectedRating,
    searchQuery,
  } = useAppSelector((state) => state.selected);

  const { excludedGenres, excludedGameModes, excludedSystems } = useAppSelector(
    (state) => state.excluded
  );

  const { isLoading, isPlatformsLoading } = useAppSelector(
    (state) => state.states
  );

  return (
    <div className={styles.consoles__igdb}>
      <div className={styles.consoles__input}>
        <h3>Search</h3>
        <input
          disabled={isLoading}
          value={searchQuery}
          onChange={(e) => dispatch(setSearchQuery(e.target.value))}
        ></input>
      </div>
      <ExtendedSelector
        title="Game Modes"
        list={gameModes}
        excluded={excludedGameModes}
        selected={selectedGameModes}
        isDisabled={isLoading}
        setExcluded={setExcludedGameModes}
        setSelected={setSelectedGameModes}
      />
      <ExtendedSelector
        title="Genres"
        list={genres}
        excluded={excludedGenres}
        selected={selectedGenres}
        isDisabled={isLoading}
        setExcluded={setExcludedGenres}
        setSelected={setSelectedGenres}
      />
      <ExtendedSelector
        title="Platforms"
        list={systemsIGDB}
        excluded={excludedSystems}
        selected={selectedSystemsIGDB}
        isDisabled={isLoading || isPlatformsLoading}
        setExcluded={setExcludedSystems}
        setSelected={setSelectedSystemsIGDB}
      />
      <div className={styles.consoles__options}>
        <ExtendedRange
          title="Rating"
          selected={selectedRating}
          setSelected={setSelectedRating}
          isDisabled={isLoading}
          min={0}
          max={99}
        />
      </div>
    </div>
  );
};
