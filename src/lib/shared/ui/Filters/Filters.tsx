import { FC } from "react";
import styles from "./Filters.module.scss";
import { useGamesFiltersStore } from "../../store/games-filters.store";
import { useCommonStore } from "../../store/common.store";
import { useStatesStore } from "../../store/states.store";
import { Input } from "../Input";
import { ExtendedSelector } from "../ExtendedSelector";
import { ExtendedRange } from "../ExtendedRange";

export const Filters: FC = () => {
  const { gameModes, genres, systems } = useCommonStore();
  const { isLoading, isPlatformsLoading } = useStatesStore();
  const {
    setSelectedGameModes,
    setSelectedGenres,
    setSelectedRating,
    setSelectedSystems,
    selectedSystems,
    selectedRating,
    selectedGenres,
    selectedGameModes,
    searchQuery,
    setSearchQuery,
    setExcludedGameModes,
    setExcludedGenres,
    setExcludedSystems,
    excludedGameModes,
    excludedGenres,
    excludedSystems,
  } = useGamesFiltersStore();

  return (
    <div className={styles.filters}>
      <Input
        containerStyles={{ width: "100%" }}
        placeholder="Enter name of the game..."
        disabled={isLoading}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
      <ExtendedSelector
        title="Game Modes"
        list={gameModes || []}
        excluded={excludedGameModes || []}
        selected={selectedGameModes || []}
        isDisabled={isLoading}
        setExcluded={setExcludedGameModes}
        setSelected={setSelectedGameModes}
      />
      <ExtendedSelector
        title="Genres"
        list={genres || []}
        excluded={excludedGenres || []}
        selected={selectedGenres || []}
        isDisabled={isLoading}
        setExcluded={setExcludedGenres}
        setSelected={setSelectedGenres}
      />
      <ExtendedSelector
        title="Platforms"
        list={systems || []}
        excluded={excludedSystems || []}
        selected={selectedSystems || []}
        isDisabled={isLoading || isPlatformsLoading}
        setExcluded={setExcludedSystems}
        setSelected={setSelectedSystems}
      />
      <div className={styles.consoles__options}>
        <ExtendedRange
          text="All ratings"
          selected={selectedRating || 0}
          setSelected={setSelectedRating}
          isDisabled={isLoading}
          min={0}
          max={99}
        />
      </div>
    </div>
  );
};
