import { FC } from "react";
import styles from "./IGDBList.module.scss";
import { useAppSelector } from "../../../store";
import {
  setSelectedGameModes,
  setSelectedGeneration,
  setSelectedGenres,
  setSelectedRating,
  setSelectedSystemsIGDB,
} from "../../../store/selectedSlice";
import {
  setExcludedGameModes,
  setExcludedGenres,
  setExcludedSystems,
} from "../../../store/excludedSlice";
import { ExtendedCheckbox } from "../../../ui/ExtendedCheckbox";
import { ExtendedRange } from "../../../ui/ExtendedRange";

const IGDBList: FC = () => {
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

  const { excludedGenres, excludedGameModes, excludedSystems } = useAppSelector(
    (state) => state.excluded
  );

  const { isLoading, isPlatformsLoading } = useAppSelector(
    (state) => state.states
  );

  return (
    <div className={styles.consoles__igdb}>
      <div className={styles.consoles__options}>
        <ExtendedRange
          title="Rating"
          selected={selectedRating}
          setSelected={setSelectedRating}
          isDisabled={isLoading}
          min={0}
          max={99}
        />
        <ExtendedRange
          title="Generations"
          selected={selectedGeneration}
          setSelected={setSelectedGeneration}
          isDisabled={isLoading}
          min={0}
          max={9}
          symbol="<= "
        />
      </div>
      <ExtendedCheckbox
        title="Game Modes"
        list={gameModes}
        excluded={excludedGameModes}
        selected={selectedGameModes}
        isDisabled={isLoading}
        setExcluded={setExcludedGameModes}
        setSelected={setSelectedGameModes}
      />
      <ExtendedCheckbox
        title="Genres"
        list={genres}
        excluded={excludedGenres}
        selected={selectedGenres}
        isDisabled={isLoading}
        setExcluded={setExcludedGenres}
        setSelected={setSelectedGenres}
      />
      {isPlatformsLoading ? (
        <div>Loading...</div>
      ) : (
        <ExtendedCheckbox
          title="Platforms"
          list={systemsIGDB}
          excluded={excludedSystems}
          selected={selectedSystemsIGDB}
          isDisabled={isLoading}
          setExcluded={setExcludedSystems}
          setSelected={setSelectedSystemsIGDB}
        />
      )}
    </div>
  );
};

export default IGDBList;
