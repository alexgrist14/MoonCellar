import { FC } from "react";
import styles from "./Filters.module.scss";
import { useCommonStore } from "../../store/common.store";
import { useStatesStore } from "../../store/states.store";
import { Input } from "../Input";
import { ExtendedSelector } from "../ExtendedSelector";
import { ExtendedRange } from "../ExtendedRange";
import { Button } from "../Button";
import {
  useGamesFiltersStore,
  useGauntletFiltersStore,
} from "../../store/filters.store";
import { Dropdown } from "../Dropdown";
import { gameCategories, gameCategoryNames } from "../../constants";
import { ButtonGroup } from "../Button/ButtonGroup";

export const Filters: FC<{ callback?: () => void; isGauntlet?: boolean }> = ({
  callback,
  isGauntlet,
}) => {
  const { gameModes, genres, systems, themes } = useCommonStore();
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
    searchCompany,
    setSearchCompany,
    selectedCategories,
    setSelectedCategories,
    selectedYears,
    setSelectedYears,
    selectedThemes,
    setSelectedThemes,
    excludedThemes,
    setExcludedThemes,
    clear,
  } = (isGauntlet ? useGauntletFiltersStore : useGamesFiltersStore)();

  return (
    <div className={styles.filters}>
      <div className={styles.filters__wrapper}>
        <h4>Game name</h4>
        <Input
          onKeyDown={(e) => e.key === "Enter" && !!callback && callback()}
          containerStyles={{ width: "100%" }}
          placeholder="Enter name of the game..."
          disabled={isLoading}
          value={searchQuery || ""}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      <div className={styles.filters__wrapper}>
        <h4>Company name</h4>
        <Input
          onKeyDown={(e) => e.key === "Enter" && !!callback && callback()}
          containerStyles={{ width: "100%" }}
          placeholder="Enter name of the developer..."
          disabled={isLoading}
          value={searchCompany || ""}
          onChange={(e) => setSearchCompany(e.target.value)}
        />
      </div>
      <div className={styles.filters__wrapper}>
        <h4>Years</h4>
        <div className={styles.filters__dates}>
          <Input
            onKeyDown={(e) => e.key === "Enter" && !!callback && callback()}
            containerStyles={{ width: "100%" }}
            disabled={isLoading}
            type="number"
            value={!!selectedYears?.[0] ? selectedYears[0].toString() : ""}
            onChange={(e) =>
              setSelectedYears([
                Number(e.target.value),
                selectedYears?.[1] || 0,
              ])
            }
          />
          <div className={styles.filters__line}></div>
          <Input
            onKeyDown={(e) => e.key === "Enter" && !!callback && callback()}
            containerStyles={{ width: "100%" }}
            disabled={isLoading}
            type="number"
            value={!!selectedYears?.[1] ? selectedYears[1].toString() : ""}
            onChange={(e) =>
              setSelectedYears([
                selectedYears?.[0] || 0,
                Number(e.target.value),
              ])
            }
          />
        </div>
      </div>
      <div className={styles.filters__wrapper}>
        <h4>Game categories</h4>
        <Dropdown
          isWithReset
          overflowRootId="consoles"
          isDisabled={isLoading}
          list={Object.keys(gameCategories).map(
            (item) => gameCategoryNames[item]
          )}
          isMulti
          overwriteValue={
            selectedCategories
              ?.map((item) => gameCategoryNames[item])
              ?.join(", ") || ""
          }
          initialMultiValue={
            selectedCategories?.map((item) =>
              Object.keys(gameCategories).findIndex((key) => key === item)
            ) || []
          }
          placeholder="Select categories..."
          getIndexes={(indexes) =>
            setSelectedCategories(
              !!indexes?.length
                ? indexes.map((index) => Object.keys(gameCategories)[index])
                : []
            )
          }
        />
      </div>
      <ExtendedSelector
        title="Platforms"
        list={systems || []}
        excluded={excludedSystems || []}
        selected={selectedSystems || []}
        isDisabled={isLoading || isPlatformsLoading}
        setExcluded={setExcludedSystems}
        setSelected={setSelectedSystems}
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
        title="Themes"
        list={themes || []}
        excluded={excludedThemes || []}
        selected={selectedThemes || []}
        isDisabled={isLoading}
        setExcluded={setExcludedThemes}
        setSelected={setSelectedThemes}
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
      <div className={styles.filters__buttons}>
        <ButtonGroup
          wrapperStyle={{ width: "100%" }}
          buttons={[
            {
              title: "Filter games",
              color: "accent",
              callback,
              isHidden: isGauntlet,
            },
            {
              title: "Clear filters",
              color: "red",
              callback: () => {
                clear();
                !!callback && callback();
              },
            },
          ]}
        />
      </div>
    </div>
  );
};
