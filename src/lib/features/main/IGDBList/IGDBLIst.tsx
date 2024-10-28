import { FC } from "react";
import styles from "./IGDBList.module.scss";
import { ExtendedSelector } from "@/src/lib/shared/ui/ExtendedSelector";
import { ExtendedRange } from "@/src/lib/shared/ui/ExtendedRange";
import { Input } from "@/src/lib/shared/ui/Input";
import { useSelectedStore } from "@/src/lib/shared/store/selected.store";
import { useExcludedStore } from "@/src/lib/shared/store/excluded.store";
import { useCommonStore } from "@/src/lib/shared/store/common.store";
import { useStatesStore } from "@/src/lib/shared/store/states.store";

export const IGDBList: FC = () => {
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
  } = useSelectedStore();
  const {
    setExcludedGameModes,
    setExcludedGenres,
    setExcludedSystems,
    excludedGameModes,
    excludedGenres,
    excludedSystems,
  } = useExcludedStore();

  return (
    <div className={styles.consoles__igdb}>
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
