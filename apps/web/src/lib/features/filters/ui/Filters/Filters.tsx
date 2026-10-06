import { FC, Fragment, useEffect, useState } from "react";
import { ACHIEVEMENTS_FILTER_OPTIONS } from "../../model/achievements-filter";
import styles from "./Filters.module.scss";
import { useCommonStore } from "@/src/lib/shared/store/common.store";
import { useStatesStore } from "@/src/lib/shared/store/states.store";
import { Input } from "@/src/lib/shared/ui/Input";
import { Dropdown } from "@/src/lib/shared/ui/Dropdown";
import { ButtonGroup } from "@/src/lib/shared/ui/Button/ButtonGroup";
import { ButtonColor } from "@/src/lib/shared/ui/Button";
import { SavedList } from "@/src/lib/shared/ui/SavedList";
import { ToggleSwitch } from "@/src/lib/shared/ui/ToggleSwitch";
import { FilterGroup } from "@/src/lib/shared/ui/FilterGroup";
import { EmptyState } from "@/src/lib/shared/ui/EmptyState";
import {
  ISortControlOption,
  SortControl,
} from "@/src/lib/shared/ui/SortControl";
import { Tabs } from "@/src/lib/shared/ui/Tabs";
import { SvgRetroAchievements, SvgSteam } from "@/src/lib/shared/ui/svg";
import { ITabContent } from "@/src/lib/shared/types/tabs.type";
import { useAuthStore } from "@/src/lib/shared/store/auth.store";
import { Loader } from "@/src/lib/shared/ui/Loader";
import { useMinimumLoading } from "@/src/lib/shared/hooks/useMinimumLoading";
import { useUserFiltersQuery } from "@/src/lib/entities/user/api/user.queries";
import { useRemoveUserFilterMutation } from "@/src/lib/entities/user/api/user.mutations";
import { modal } from "@/src/lib/shared/ui/Modal";
import { SaveFilterForm } from "@/src/lib/features/filters/ui/SaveFilterForm";
import { useAdvancedRouter } from "@/src/lib/shared/hooks/useAdvancedRouter";
import { IGameFilters, IGetGamesRequest } from "@mooncellar/schemas";
import { toast } from "@/src/lib/shared/utils/toast.utils";
import {
  getFiltersForQuery,
  parseQueryFilters,
  pushFiltersToQuery,
} from "@/src/lib/shared/utils/filters.utils";
import { RangeSelector } from "@/src/lib/shared/ui/RangeSelector";
import { useFiltersStore } from "@/src/lib/shared/store/filters.store";
import { useExpandStore } from "@/src/lib/shared/store/expand.store";

const sortOptions: ISortControlOption<
  NonNullable<IGetGamesRequest["sortBy"]>
>[] = [
  { value: "name", label: "Name" },
  { value: "first_release", label: "Release date" },
  { value: "rating", label: "Average Rating" },
  { value: "ratingsCount", label: "Ratings count" },
  { value: "total_rating", label: "IGDB rating" },
  { value: "total_rating_count", label: "IGDB rating count" },
  { value: "createdAt", label: "Date added" },
];

export const Filters: FC<{
  callback?: (filters?: IGameFilters) => void;
  isGauntlet?: boolean;
  isSortHidden?: boolean;
}> = ({ isGauntlet, isSortHidden, callback }) => {
  const { asPath } = useAdvancedRouter();
  const { profile, isAuth } = useAuthStore();

  const [filters, setFilters] = useState<IGetGamesRequest | undefined>(() =>
    parseQueryFilters(asPath)
  );
  const [tab, setTab] = useState<"filters" | "saved">("filters");
  const urlFiltersKey = getFiltersForQuery(parseQueryFilters(asPath));
  const [appliedFiltersKey, setAppliedFiltersKey] = useState(urlFiltersKey);
  const [resetCount, setResetCount] = useState(0);

  if (urlFiltersKey !== appliedFiltersKey) {
    setAppliedFiltersKey(urlFiltersKey);
    setFilters(parseQueryFilters(asPath));
  }

  const resetFields = (next: IGetGamesRequest) => {
    setFilters(next);
    setResetCount((count) => count + 1);
  };

  const { data: savedFilters } = useUserFiltersQuery(
    isAuth ? (profile?._id ?? "") : ""
  );
  const { mutate: removeFilter } = useRemoveUserFilterMutation();

  const {
    themes,
    systems,
    genres,
    gameModes,
    gameTypes,
    keywords,
    franchises,
    companies,
    gameEngines,
    playerPerspectives,
    languages,
    statuses,
    ageRatings,
  } = useCommonStore();
  const { isLoading, isPlatformsLoading } = useStatesStore();
  const isSavedFiltersLoaderShown = useMinimumLoading(!savedFilters);
  const { isExcludeHistory, setExcludeHistory } = useFiltersStore();
  const { expanded, setExpanded } = useExpandStore();

  const getValue = (key: keyof IGameFilters) =>
    (!!filters?.selected?.[key]?.length
      ? filters?.selected?.[key]?.length + " selected"
      : "All") +
    (!!filters?.excluded?.[key]?.length
      ? ", " + filters?.excluded?.[key]?.length + " excluded"
      : "");

  const getSelectedArray = (key: keyof IGameFilters, array?: string[]) =>
    !!array && Array.isArray(filters?.selected?.[key])
      ? filters?.selected?.[key]?.map((value) =>
          array.findIndex((el) => el === value)
        ) || []
      : [];

  const getExcludedArray = (key: keyof IGameFilters, array?: string[]) =>
    !!array && Array.isArray(filters?.excluded?.[key])
      ? filters?.excluded?.[key]?.map((value) =>
          array.findIndex((el) => el === value)
        ) || []
      : [];

  const setSelected = (key: string, indexes: number[], array?: string[]) => {
    setFilters((filters) => {
      const temp = {
        ...filters,
        selected: {
          ...filters?.selected,
          [key]:
            !!array && !!indexes?.length
              ? indexes.map((index) => array[index])
              : [],
        },
      };

      return temp;
    });
  };

  const setExcluded = (key: string, indexes: number[], array?: string[]) => {
    setFilters((filters) => {
      const temp = {
        ...filters,
        excluded: {
          ...filters?.excluded,
          [key]:
            !!array && !!indexes?.length
              ? indexes.map((index) => array[index])
              : [],
        },
      };

      return temp;
    });
  };

  type IModeKey = keyof NonNullable<IGetGamesRequest["mode"]>;

  const toggleMode = (key: IModeKey) => {
    setFilters((filters) => ({
      ...filters,
      mode: {
        ...filters?.mode,
        [key]: filters?.mode?.[key] === "all" ? "any" : "all",
      },
    }));
  };

  const renderModeToggle = (key: IModeKey) => (
    <ToggleSwitch
      isColorless
      isDisabled={isLoading}
      leftContent="Any"
      rightContent="All"
      checked={filters?.mode?.[key] === "all"}
      onChange={() => toggleMode(key)}
    />
  );

  const platformIds = systems?.map((item) => item._id);

  const categories: {
    key: IModeKey & keyof IGameFilters;
    title: string;
    placeholder: string;
    list?: string[];
    values?: string[];
    isDisabled?: boolean;
  }[] = [
    {
      key: "types",
      title: "Game types",
      placeholder: "Select game types...",
      list: gameTypes,
    },
    {
      key: "modes",
      title: "Game Modes",
      placeholder: "Select modes...",
      list: gameModes,
    },
    {
      key: "platforms",
      title: "Platforms",
      placeholder: "Select platforms...",
      list: systems?.map((item) => item.name),
      values: platformIds,
      isDisabled: isPlatformsLoading,
    },
    {
      key: "genres",
      title: "Genres",
      placeholder: "Select genres...",
      list: genres,
    },
    {
      key: "themes",
      title: "Themes",
      placeholder: "Select themes...",
      list: themes,
    },
    {
      key: "keywords",
      title: "Keywords",
      placeholder: "Select keywords...",
      list: keywords,
    },
    {
      key: "franchises",
      title: "Franchises",
      placeholder: "Select franchises...",
      list: franchises,
    },
    {
      key: "companies",
      title: "Companies",
      placeholder: "Select companies...",
      list: companies,
    },
    {
      key: "game_engines",
      title: "Game Engines",
      placeholder: "Select game engines...",
      list: gameEngines,
    },
    {
      key: "player_perspectives",
      title: "Player Perspectives",
      placeholder: "Select player perspectives...",
      list: playerPerspectives,
    },
    {
      key: "languages",
      title: "Languages",
      placeholder: "Select languages...",
      list: languages,
    },
    {
      key: "status",
      title: "Status",
      placeholder: "Select status...",
      list: statuses,
    },
    {
      key: "ageRatings",
      title: "Age Ratings",
      placeholder: "Select age ratings...",
      list: ageRatings,
    },
  ];

  const tabs: ITabContent[] = [
    { tabName: "Filters", onTabClick: () => setTab("filters") },
    ...(isAuth
      ? [{ tabName: "Saved", onTabClick: () => setTab("saved") }]
      : []),
  ];

  useEffect(() => {
    !filters && setFilters(parseQueryFilters(asPath));
  }, [asPath, filters]);

  return (
    <div className={styles.filters} id="filters">
      {isAuth && (
        <Tabs
          isUseDefaultIndex
          defaultTabIndex={tabs.findIndex(
            ({ tabName }) => tabName.toLowerCase() === tab
          )}
          contents={tabs}
        />
      )}
      {tab === "filters" && (
        <Fragment key={`${appliedFiltersKey}:${resetCount}`}>
          {!isGauntlet && !isSortHidden && (
            <SortControl
              label="Sort by"
              options={sortOptions}
              sortBy={filters?.sortBy}
              sortOrder={filters?.sortOrder ?? "desc"}
              placeholder="Default"
              overflowRootId="filters"
              isWithReset
              isThroughPortal={false}
              isDisabled={isLoading}
              onChange={(sortBy, sortOrder) =>
                setFilters((filters) => ({
                  ...filters,
                  sortBy,
                  sortOrder:
                    sortOrder === (filters?.sortOrder ?? "desc")
                      ? filters?.sortOrder
                      : sortOrder,
                }))
              }
            />
          )}
          <FilterGroup title="Game name">
            <Input
              onKeyDown={(e) =>
                e.key === "Enter" && !!filters && pushFiltersToQuery(filters)
              }
              containerStyles={{ width: "100%" }}
              placeholder="Enter name of the game..."
              disabled={isLoading}
              value={filters?.search || ""}
              onChange={(e) => {
                const temp = {
                  ...filters,
                  search: e.target.value || undefined,
                };

                setFilters(temp);
              }}
            />
          </FilterGroup>
          <div className={styles.filters__row}>
            {categories.map(
              ({ key, title, placeholder, list, values, isDisabled }) => (
                <FilterGroup
                  key={key}
                  title={title}
                  headerAction={renderModeToggle(key)}
                >
                  <Dropdown
                    isWithReset
                    isMulti
                    isWithExclude
                    overflowRootId="filters"
                    isDisabled={isLoading || isDisabled}
                    list={list || []}
                    isLoading={!list}
                    overwriteValue={getValue(key)}
                    initialMultiValue={getSelectedArray(key, values ?? list)}
                    initialExcludeValue={getExcludedArray(key, values ?? list)}
                    placeholder={placeholder}
                    getIndexes={(indexes) =>
                      setSelected(key, indexes, values ?? list)
                    }
                    getExcludeIndexes={(indexes) =>
                      setExcluded(key, indexes, values ?? list)
                    }
                  />
                </FilterGroup>
              )
            )}
          </div>
          <FilterGroup title="Years">
            <div className={styles.filters__dates}>
              <Input
                onKeyDown={(e) =>
                  e.key === "Enter" && !!filters && pushFiltersToQuery(filters)
                }
                containerStyles={{ width: "100%" }}
                disabled={isLoading}
                placeholder="Start..."
                type="number"
                value={
                  filters?.years?.[0] != null ? String(filters.years[0]) : ""
                }
                onChange={(e) => {
                  const start = e.target.value ? Number(e.target.value) : null;
                  const end = filters?.years?.[1] ?? null;

                  const temp: IGetGamesRequest = {
                    ...filters,
                    years:
                      start == null && end == null ? undefined : [start, end],
                  };

                  setFilters(temp);
                }}
              />
              <div className={styles.filters__line}></div>
              <Input
                onKeyDown={(e) =>
                  e.key === "Enter" && !!filters && pushFiltersToQuery(filters)
                }
                containerStyles={{ width: "100%" }}
                disabled={isLoading}
                placeholder="End..."
                type="number"
                value={
                  filters?.years?.[1] != null ? String(filters.years[1]) : ""
                }
                onChange={(e) => {
                  const start = filters?.years?.[0] ?? null;
                  const end = e.target.value ? Number(e.target.value) : null;

                  const temp: IGetGamesRequest = {
                    ...filters,
                    years:
                      start == null && end == null ? undefined : [start, end],
                  };

                  setFilters(temp);
                }}
              />
            </div>
          </FilterGroup>
          <div className={styles.range__wrapper}>
            <RangeSelector
              text={!!filters?.rating ? "From " + filters.rating : "Any rating"}
              defaultValue={filters?.rating}
              min={0}
              max={99}
              callback={(rating) => {
                const temp: IGetGamesRequest = {
                  ...filters,
                  rating,
                };

                setFilters(temp);
              }}
              disabled={!!isLoading}
            />
          </div>
          <div className={styles.range__wrapper}>
            <RangeSelector
              text={
                !!filters?.votes ? "From " + filters.votes : "Any votes count"
              }
              defaultValue={filters?.votes}
              min={0}
              max={1000}
              step={10}
              callback={(votes) => {
                const temp: IGetGamesRequest = {
                  ...filters,
                  votes,
                };

                setFilters(temp);
              }}
              disabled={!!isLoading}
            />
          </div>
          <FilterGroup
            title="Achievements"
            className={styles.filters__achievements}
          >
            <Dropdown
              overflowRootId="filters"
              isDisabled={isLoading}
              list={ACHIEVEMENTS_FILTER_OPTIONS.map(({ label }) => label)}
              iconNodes={ACHIEVEMENTS_FILTER_OPTIONS.map(({ value }) =>
                value === "steam" ? (
                  <SvgSteam key="steam" size="16" />
                ) : value === "ra" ? (
                  <SvgRetroAchievements key="ra" size="16" />
                ) : null
              )}
              hints={ACHIEVEMENTS_FILTER_OPTIONS.map(({ hint }) => hint)}
              overwriteValue={
                ACHIEVEMENTS_FILTER_OPTIONS.find(
                  ({ value }) => value === filters?.achievements
                )?.label
              }
              getIndex={(index) =>
                setFilters((filters) => ({
                  ...filters,
                  achievements: ACHIEVEMENTS_FILTER_OPTIONS[index]?.value,
                }))
              }
            />
          </FilterGroup>
          <div className={styles.filters__toggles}>
            <ToggleSwitch
              label="Steam games"
              labelPosition="end"
              checked={!!filters?.isOnlySteam}
              onChange={(isOnlySteam) =>
                setFilters((filters) => ({
                  ...filters,
                  isOnlySteam: isOnlySteam || undefined,
                }))
              }
            />
            {isGauntlet && (
              <ToggleSwitch
                label="Exclude history"
                labelPosition="end"
                checked={isExcludeHistory}
                onChange={setExcludeHistory}
              />
            )}
          </div>
          <ButtonGroup
            wrapperClassName={styles.filters__buttons}
            wrapperStyle={{ width: "100%" }}
            buttons={[
              {
                title: "Filter games",
                color: ButtonColor.ACCENT,
                disabled: !filters,
                onClick: () => {
                  !!filters && pushFiltersToQuery(filters);
                  setExpanded(expanded?.filter((pos) => pos !== "left") || []);
                  !!callback && callback();
                },
                hidden: isGauntlet,
              },
              {
                title: "Apply filters",
                color: ButtonColor.ACCENT,
                disabled: !filters,
                onClick: () => {
                  !!filters && pushFiltersToQuery(filters);
                  setExpanded(expanded?.filter((pos) => pos !== "left") || []);
                  !!callback && callback();
                },
                hidden: !isGauntlet,
              },
              {
                title: "Save filters",
                hidden: !profile || !filters,
                onClick: () =>
                  !!filters && modal.open(<SaveFilterForm filters={filters} />),
              },
              {
                title: "Clear filters",
                color: ButtonColor.RED,
                onClick: () => resetFields({}),
              },
            ]}
          />
        </Fragment>
      )}
      {tab === "saved" && (
        <div>
          {!!savedFilters && !isSavedFiltersLoaderShown ? (
            <div>
              {!!savedFilters?.length ? (
                <SavedList
                  items={savedFilters.map((filter) => ({
                    name: filter.name,
                    onApply: () => {
                      resetFields(parseQueryFilters(`?${filter.filter}`));
                      setTab("filters");
                    },
                    onRemove: () =>
                      !!profile &&
                      removeFilter(
                        { userId: profile._id, name: filter.name },
                        {
                          onSuccess: () =>
                            toast.success({
                              description: "Filter was successfully removed!",
                            }),
                        }
                      ),
                  }))}
                />
              ) : (
                <EmptyState variant="compact" title="List is empty" />
              )}
            </div>
          ) : (
            <Loader type="propogate" />
          )}
        </div>
      )}
    </div>
  );
};
