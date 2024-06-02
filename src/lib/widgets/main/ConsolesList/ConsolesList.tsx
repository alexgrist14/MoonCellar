import { FC, useEffect } from "react";
import styles from "./ConsolesList.module.scss";
import { useAppDispatch, useAppSelector } from "@/src/lib/app/store";
import { getRoyalGames } from "@/src/lib/shared/utils/getRoyalGames";
import { getGenres, getModes, getPlatforms } from "@/src/lib/shared/utils/IGDB";
import { apiNames, selectStyles } from "@/src/lib/shared/constants";
import ReactSelect from "react-select";
import { ToggleSwitch } from "@/src/lib/shared/ui/ToggleSwitch";
import { setSystemsRA } from "@/src/lib/app/store/slices/commonSlice";
import { setPlatformsLoading } from "@/src/lib/app/store/slices/statesSlice";
import { ConsolesGroup, IGDBList, RoyalList } from "@/src/lib/features/main";
import {
  setApiType,
  setOnlyWithAchievements,
  setRoyal,
} from "@/src/lib/app/store/slices/selectedSlice";
import { API } from "@/src/lib/shared/api";

export const ConsolesList: FC = () => {
  const dispatch = useAppDispatch();
  const { apiType, isRoyal, isOnlyWithAchievements, selectedGeneration } =
    useAppSelector((state) => state.selected);
  const { isLoading } = useAppSelector((state) => state.states);
  const { token } = useAppSelector((state) => state.auth);

  const consolesGroup = [
    "Nintendo",
    "Sony",
    "Atari",
    "Sega",
    "NEC",
    "SNK",
    "Other",
  ];

  const royalGames = getRoyalGames();

  useEffect(() => {
    if (isRoyal) return;

    const fetchConsoleIds = async () => {
      const { data: consoles } = await API.getConsoles();
      dispatch(setSystemsRA(consoles));
    };

    apiType === "RA" && fetchConsoleIds();

    if (apiType === "IGDB" && !!token) {
      getGenres();
      getModes();
    }
  }, [apiType, isRoyal, token, dispatch]);

  useEffect(() => {
    if (apiType !== "IGDB" || isRoyal || !token) return;

    dispatch(setPlatformsLoading(true));

    getPlatforms(selectedGeneration);
  }, [selectedGeneration, dispatch, apiType, isRoyal, token]);

  return (
    <div className={styles.consoles__list}>
      <ReactSelect
        isDisabled={isLoading}
        isSearchable={false}
        styles={selectStyles<string>("default")}
        placeholder="Select Type"
        isClearable={false}
        isMulti={false}
        defaultValue={{
          value: apiType,
          label: apiNames[apiType] || "",
        }}
        onChange={(item) => {
          !!item?.value && dispatch(setApiType(item.value));
        }}
        options={Object.keys(apiNames).map((type) => ({
          label: apiNames[type],
          value: type,
        }))}
      />
      <div className={styles.consoles__options}>
        <h3>Options</h3>
        {apiType === "RA" && (
          <label className={styles.consoles__option}>
            <ToggleSwitch
              defaultValue={isOnlyWithAchievements ? "right" : "left"}
              clickCallback={() =>
                dispatch(setOnlyWithAchievements(!isOnlyWithAchievements))
              }
              isDisabled={isLoading}
            />
            Only with achievements
          </label>
        )}
        <label className={styles.consoles__toggle}>
          <ToggleSwitch
            defaultValue={isRoyal ? "right" : "left"}
            clickCallback={() => dispatch(setRoyal(!isRoyal))}
            isDisabled={isLoading}
          />
          <span>
            Royal {!!royalGames?.length ? `(Games: ${royalGames.length})` : ""}
          </span>
        </label>
      </div>
      {apiType === "IGDB" && !isRoyal && <IGDBList />}
      {apiType === "RA" && !isRoyal && (
        <div className={styles.consoles__groups}>
          {consolesGroup.map((item, i) => (
            <ConsolesGroup key={i} system={item} />
          ))}
        </div>
      )}
      {isRoyal && <RoyalList />}
    </div>
  );
};
