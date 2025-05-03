import { FC, useEffect, useState } from "react";
import styles from "./Filters.module.scss";
import { useCommonStore } from "../../store/common.store";
import { useStatesStore } from "../../store/states.store";
import { Input } from "../Input";
import { Dropdown } from "../Dropdown";
import { gameCategories, gameCategoryNames } from "../../constants";
import { ButtonGroup } from "../Button/ButtonGroup";
import { ToggleSwitch } from "../ToggleSwitch";
import { IGameFilters } from "../../types/filters.type";
import { useRouter } from "next/router";
import { RangeSelector } from "../RangeSelector";
import {
  parseQueryFilters,
  pushFiltersToQuery,
} from "../../utils/filters.util";
import { Tabs } from "../Tabs";
import { ITabContent } from "../../types/tabs";
import { IGDBApi, userAPI } from "../../api";
import { useAuthStore } from "../../store/auth.store";
import { Loader } from "../Loader";
import { axiosUtils } from "../../utils/axios";
import { IUserFilter } from "../../types/user.type";
import { modal } from "../Modal";
import { SaveFilterForm } from "../SaveFilterForm";
import { toast } from "../../utils/toast";
import { IGDBDefault } from "../../types/igdb";
import { useDebouncedCallback } from "use-debounce";

export const Filters: FC<{
  callback?: (filters?: IGameFilters) => void;
  isGauntlet?: boolean;
}> = ({ callback, isGauntlet }) => {
  const router = useRouter();
  const { asPath } = router;
  const { profile, isAuth } = useAuthStore();

  const [filters, setFilters] = useState<IGameFilters>();
  const [tab, setTab] = useState<"filters" | "saved">("filters");
  const [savedFilters, setSavedFilters] = useState<IUserFilter[]>();
  const [keywordsList, setKeywordsList] = useState<IGDBDefault[]>([]);

  const { themes, systems, genres, gameModes } = useCommonStore();
  const { isLoading, isPlatformsLoading, isExcludeHistory, setExcludeHistory } =
    useStatesStore();

  const getValue = (key: string) =>
    (!!filters?.selected?.[key]?.length
      ? filters?.selected?.[key]?.length + " selected"
      : "All") +
    (!!filters?.excluded?.[key]?.length
      ? ", " + filters?.excluded?.[key]?.length + " excluded"
      : "");

  const getSelectedArray = (key: string, array?: { _id: number }[]) =>
    !!array
      ? filters?.selected?.[key]?.map((id) =>
          array.findIndex((el) => el._id === id)
        ) || []
      : [];

  const getExcludedArray = (key: string, array?: { _id: number }[]) =>
    !!array
      ? filters?.excluded?.[key]?.map((id) =>
          array.findIndex((el) => el._id === id)
        ) || []
      : [];

  const setSelected = (
    key: string,
    indexes: number[],
    array?: { _id: number }[]
  ) => {
    setFilters((filters) => {
      const temp = {
        ...filters,
        selected: {
          ...filters?.selected,
          [key]:
            !!array && !!indexes?.length
              ? indexes.map((index) => array[index]._id)
              : [],
        },
      };

      isGauntlet && pushFiltersToQuery(temp, router);

      return temp;
    });
  };

  const setExcluded = (
    key: string,
    indexes: number[],
    array?: { _id: number }[]
  ) => {
    setFilters((filters) => {
      const temp = {
        ...filters,
        excluded: {
          ...filters?.excluded,
          [key]:
            !!array && !!indexes?.length
              ? indexes.map((index) => array[index]._id)
              : [],
        },
      };

      isGauntlet && pushFiltersToQuery(temp, router);

      return temp;
    });
  };

  const tabs: ITabContent[] = [
    { tabName: "Filters", onTabClick: () => setTab("filters") },
    ...(isAuth
      ? [{ tabName: "Saved", onTabClick: () => setTab("saved") }]
      : []),
  ];

  const debouncedSetKeywords = useDebouncedCallback((query) => {
    IGDBApi.getKeywordsByIds([
      ...(filters?.selected?.keywords || []),
      ...(filters?.excluded?.keywords || []),
    ]).then(({ data: filterKeywords }) => {
      query?.length > 2
        ? IGDBApi.getKeywords(query).then((res) => {
            setKeywordsList([
              ...filterKeywords,
              ...res.data.filter(
                (keyword) =>
                  !filterKeywords.some((word) => word._id === keyword._id)
              ),
            ]);
          })
        : setKeywordsList(filterKeywords);
    });
  }, 300);

  useEffect(() => {
    setFilters(parseQueryFilters(asPath));
  }, [asPath]);

  useEffect(() => {
    !!profile?._id &&
      userAPI
        .getFilters(profile?._id)
        .then((res) => setSavedFilters(res.data.filters))
        .catch(axiosUtils.toastError);
  }, [profile]);

  return (
    <div className={styles.filters} id="filters">
      {isAuth && (
        <Tabs
          defaultTabIndex={tabs.findIndex(
            ({ tabName }) => tabName.toLowerCase() === tab
          )}
          contents={tabs}
        />
      )}
      {tab === "filters" && (
        <>
          <div className={styles.filters__top}>
            <div className={styles.filters__wrapper}>
              <h4>Game name</h4>
              <Input
                onKeyDown={(e) =>
                  e.key === "Enter" &&
                  !!filters &&
                  pushFiltersToQuery(filters, router)
                }
                containerStyles={{ width: "100%" }}
                placeholder="Enter name of the game..."
                disabled={isLoading}
                value={filters?.search || ""}
                onChange={(e) => {
                  const temp = { ...filters, search: e.target.value };

                  setFilters(temp);
                  isGauntlet && pushFiltersToQuery(temp, router);
                }}
              />
            </div>
            <div className={styles.filters__wrapper}>
              <h4>Game company</h4>
              <Input
                onKeyDown={(e) =>
                  e.key === "Enter" &&
                  !!filters &&
                  pushFiltersToQuery(filters, router)
                }
                containerStyles={{ width: "100%" }}
                placeholder="Enter name of the developer..."
                disabled={isLoading}
                value={filters?.company || ""}
                onChange={(e) => {
                  const temp = { ...filters, company: e.target.value };

                  setFilters(temp);
                  isGauntlet && pushFiltersToQuery(temp, router);
                }}
              />
            </div>
          </div>
          <div className={styles.filters__wrapper}>
            <h4>Categories</h4>
            <Dropdown
              isWithReset
              overflowRootId="filters"
              isDisabled={isLoading}
              list={Object.keys(gameCategories).map(
                (item) => gameCategoryNames[item]
              )}
              isMulti
              overwriteValue={
                filters?.categories
                  ?.map((item) => gameCategoryNames[item])
                  ?.join(", ") || ""
              }
              initialMultiValue={
                filters?.categories?.map((item) =>
                  Object.keys(gameCategories).findIndex((key) => key === item)
                ) || []
              }
              placeholder="Select categories..."
              getIndexes={(indexes) => {
                const temp = {
                  ...filters,
                  categories: !!indexes?.length
                    ? indexes.map((index) => Object.keys(gameCategories)[index])
                    : [],
                };

                setFilters(temp);
                isGauntlet && pushFiltersToQuery(temp, router);
              }}
            />
          </div>
          <div className={styles.filters__wrapper}>
            <h4>Platforms</h4>
            <Dropdown
              isWithReset
              isMulti
              isWithExclude
              overflowRootId="filters"
              isDisabled={isLoading || isPlatformsLoading}
              list={systems?.map((item) => item.name) || []}
              overwriteValue={getValue("platforms")}
              initialMultiValue={getSelectedArray("platforms", systems)}
              initialExcludeValue={getExcludedArray("platforms", systems)}
              placeholder="Select platforms..."
              getIndexes={(indexes) =>
                setSelected("platforms", indexes, systems)
              }
              getExcludeIndexes={(indexes) =>
                setExcluded("platforms", indexes, systems)
              }
            />
          </div>
          <div className={styles.filters__wrapper}>
            <h4>Genres</h4>
            <Dropdown
              isWithReset
              isMulti
              isWithExclude
              overflowRootId="filters"
              isDisabled={isLoading}
              list={genres?.map((item) => item.name) || []}
              overwriteValue={getValue("genres")}
              initialMultiValue={getSelectedArray("genres", genres)}
              initialExcludeValue={getExcludedArray("genres", genres)}
              placeholder="Select genres..."
              getIndexes={(indexes) => setSelected("genres", indexes, genres)}
              getExcludeIndexes={(indexes) =>
                setExcluded("genres", indexes, genres)
              }
            />
          </div>
          <div className={styles.filters__wrapper}>
            <h4>Themes</h4>
            <Dropdown
              isWithReset
              isMulti
              isWithExclude
              overflowRootId="filters"
              isDisabled={isLoading}
              list={themes?.map((item) => item.name) || []}
              overwriteValue={getValue("themes")}
              initialMultiValue={getSelectedArray("themes", themes)}
              initialExcludeValue={getExcludedArray("themes", themes)}
              placeholder="Select themes..."
              getIndexes={(indexes) => setSelected("themes", indexes, themes)}
              getExcludeIndexes={(indexes) =>
                setExcluded("themes", indexes, themes)
              }
            />
          </div>
          <div className={styles.filters__wrapper}>
            <h4>Keywords</h4>
            <Dropdown
              isWithReset
              isMulti
              isWithExclude
              isWithSearch
              overflowRootId="filters"
              isDisabled={isLoading}
              onLoad={() => {
                IGDBApi.getKeywordsByIds([
                  ...(filters?.selected?.keywords || []),
                  ...(filters?.excluded?.keywords || []),
                ]).then((res) => {
                  setKeywordsList(res.data);
                });
              }}
              onClose={() => {
                setKeywordsList((list) =>
                  list.filter(
                    (item) =>
                      filters?.selected?.keywords?.includes(item._id) ||
                      filters?.excluded?.keywords?.includes(item._id)
                  )
                );
              }}
              getSearchQuery={debouncedSetKeywords}
              list={keywordsList?.map((item) => item.name) || []}
              overwriteValue={getValue("keywords")}
              initialMultiValue={getSelectedArray("keywords", keywordsList)}
              initialExcludeValue={getExcludedArray("keywords", keywordsList)}
              placeholder="Select keywords..."
              getIndexes={(indexes) =>
                setSelected("keywords", indexes, keywordsList)
              }
              getExcludeIndexes={(indexes) =>
                setExcluded("keywords", indexes, keywordsList)
              }
            />
          </div>
          <div className={styles.filters__wrapper}>
            <h4>Game Modes</h4>
            <Dropdown
              isWithReset
              isMulti
              isWithExclude
              overflowRootId="filters"
              isDisabled={isLoading}
              list={gameModes?.map((item) => item.name) || []}
              overwriteValue={getValue("modes")}
              initialMultiValue={getSelectedArray("modes", gameModes)}
              initialExcludeValue={getExcludedArray("modes", gameModes)}
              placeholder="Select modes..."
              getIndexes={(indexes) => setSelected("modes", indexes, gameModes)}
              getExcludeIndexes={(indexes) =>
                setExcluded("modes", indexes, gameModes)
              }
            />
          </div>
          <div className={styles.filters__wrapper}>
            <h4>Years</h4>
            <div className={styles.filters__dates}>
              <Input
                onKeyDown={(e) =>
                  e.key === "Enter" &&
                  !!filters &&
                  pushFiltersToQuery(filters, router)
                }
                containerStyles={{ width: "100%" }}
                disabled={isLoading}
                placeholder="Start..."
                type="number"
                value={!!filters?.years?.[0] ? filters.years[0].toString() : ""}
                onChange={(e) => {
                  const temp: IGameFilters = {
                    ...filters,
                    years: [Number(e.target.value), filters?.years?.[1] || 0],
                  };

                  setFilters(temp);
                  isGauntlet && pushFiltersToQuery(temp, router);
                }}
              />
              <div className={styles.filters__line}></div>
              <Input
                onKeyDown={(e) =>
                  e.key === "Enter" &&
                  !!filters &&
                  pushFiltersToQuery(filters, router)
                }
                containerStyles={{ width: "100%" }}
                disabled={isLoading}
                placeholder="End..."
                type="number"
                value={!!filters?.years?.[1] ? filters.years[1].toString() : ""}
                onChange={(e) => {
                  const temp: IGameFilters = {
                    ...filters,
                    years: [filters?.years?.[0] || 0, Number(e.target.value)],
                  };

                  setFilters(temp);
                  isGauntlet && pushFiltersToQuery(temp, router);
                }}
              />
            </div>
          </div>
          <div className={styles.range__wrapper}>
            <RangeSelector
              text={!!filters?.rating ? "From " + filters.rating : "Any rating"}
              defaultValue={filters?.rating}
              min={0}
              max={99}
              callback={(rating) => {
                const temp: IGameFilters = {
                  ...filters,
                  rating,
                };

                setFilters(temp);
                isGauntlet && pushFiltersToQuery(temp, router);
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
                const temp: IGameFilters = {
                  ...filters,
                  votes,
                };

                setFilters(temp);
                isGauntlet && pushFiltersToQuery(temp, router);
              }}
              disabled={!!isLoading}
            />
          </div>
          <div className={styles.filters__toggles}>
            <div className={styles.filters__toggle}>
              <ToggleSwitch
                value={!!filters?.isOnlyWithAchievements ? "right" : "left"}
                clickCallback={() => {
                  const temp: IGameFilters = {
                    ...filters,
                    isOnlyWithAchievements:
                      !filters?.isOnlyWithAchievements || undefined,
                  };

                  setFilters(temp);
                  isGauntlet && pushFiltersToQuery(temp, router);
                }}
              />
              <p>Only with achievements</p>
            </div>
            {isGauntlet && (
              <div className={styles.filters__toggle}>
                <ToggleSwitch
                  value={isExcludeHistory ? "right" : "left"}
                  clickCallback={() => setExcludeHistory(!isExcludeHistory)}
                />
                <p>Exclude history</p>
              </div>
            )}
          </div>
          <ButtonGroup
            wrapperClassName={styles.filters__buttons}
            wrapperStyle={{ width: "100%" }}
            buttons={[
              {
                title: "Filter games",
                color: "accent",
                isDisabled: !filters,
                callback: () => {
                  !!filters && pushFiltersToQuery(filters, router);
                },
                isHidden: isGauntlet,
              },
              {
                title: "Save filters",
                isHidden: !profile || !filters,
                callback: () =>
                  !!filters &&
                  modal.open(
                    <SaveFilterForm
                      filters={filters}
                      setSavedFilters={setSavedFilters}
                    />
                  ),
              },
              {
                title: "Clear filters",
                color: "red",
                callback: () => {
                  pushFiltersToQuery({}, router);
                },
              },
            ]}
          />
        </>
      )}
      {tab === "saved" && (
        <div>
          {!!savedFilters ? (
            <div className={styles.filters__saved}>
              {!!savedFilters?.length ? (
                savedFilters.map((filter, i) => (
                  <ButtonGroup
                    key={i}
                    isCompact
                    wrapperStyle={{
                      padding: "0",
                      display: "grid",
                      gridTemplateColumns: "1fr 20%",
                      width: "100%",
                    }}
                    buttons={[
                      {
                        title: filter.name,
                        color: "fancy",
                        style: { textAlign: "start" },
                        callback: () =>
                          router.push({ ...router, query: filter.filter }),
                      },
                      {
                        title: "Remove",
                        callback: () =>
                          !!profile &&
                          userAPI
                            .removeFilter(profile._id, filter.name)
                            .then((res) => {
                              toast.success({
                                description: "Filter was successfully removed!",
                              });
                              setSavedFilters(res.data.filters);
                            })
                            .catch(axiosUtils.toastError),
                        color: "red",
                      },
                    ]}
                  />
                ))
              ) : (
                <p style={{ textAlign: "center" }}>List is empty</p>
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
