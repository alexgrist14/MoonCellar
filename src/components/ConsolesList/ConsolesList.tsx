import {
  Dispatch,
  FC,
  SetStateAction,
  useEffect,
  useState,
} from "react";
import { IConsole } from "../../interfaces/responses";
import { getConsoleIds } from "@retroachievements/api";
import { authorization } from "../../utils/authorization";
import { consolesImages } from "../../utils/consoleImages";
import ConsolesGroup from "./ConsolesGroup/ConsolesGroup";
import styles from "./ConsolesList.module.scss";
import Toggle from "@atlaskit/toggle";
import { IIGDBGenre, IIGDBPlatform } from "../../interfaces";
import { getGenres, getPlatforms } from "../../utils/IGDB";
import { useAppDispatch, useAppSelector } from "../../store";
import { setApiType, setRoyal } from "../../store/commonSlice";
import { setLoading } from "../../store/statesSlice";
import RoyalList from "./RoyalList/RoyalList";
import IGDBList from "./IGDBList/IGDBLIst";

interface ConsolesListProps {
  selectedRating: number;
  setSelectedRating: Dispatch<SetStateAction<number>>;
  selectedGenres: number[];
  setSelectedGenres: Dispatch<SetStateAction<number[]>>;
}

const ConsolesList: FC<ConsolesListProps> = ({
  selectedRating,
  setSelectedRating,
  selectedGenres,
  setSelectedGenres,
}) => {
  const dispatch = useAppDispatch();
  const { apiType, isRoyal } = useAppSelector((state) => state.common);
  const { token } = useAppSelector((state) => state.auth);

  const [IGDBPlatforms, setIGDBPlatforms] = useState<IIGDBPlatform[]>([]);
  const [IGDBGenres, setIGDBGenres] = useState<IIGDBGenre[]>([]);

  const [selectedGeneration, setSelectedGeneration] = useState<number>(0);

  const [consoles, setConsoles] = useState<IConsole[]>([]);

  const consolesGroup = [
    "Nintendo",
    "Sony",
    "Atari",
    "Sega",
    "NEC",
    "SNK",
    "Other",
  ];

  const fetchConsoleIds = async () => {
    const consolesIds = await getConsoleIds(authorization);
    const consolesImagesIds = consolesImages.map((image) => image.id);

    const consolesWithAchievements: IConsole[] | undefined = consolesIds.filter(
      (console) => consolesImagesIds.includes(console.id)
    );
    setConsoles(consolesWithAchievements);
  };

  useEffect(() => {
    if (isRoyal) return;

    apiType === "RA" && fetchConsoleIds();
    apiType === "IGDB" && !!token && getGenres(setIGDBGenres);
  }, [apiType, isRoyal, token]);

  useEffect(() => {
    if (apiType !== "IGDB" || isRoyal || !token) return;

    dispatch(setLoading(true));
    getPlatforms(setIGDBPlatforms, selectedGeneration);
  }, [selectedGeneration, dispatch, apiType, isRoyal, token]);

  return (
    <div className={styles.consoles__list}>
      <div className={styles.consoles__options}>
        <label className={styles.consoles__toggle}>
          <Toggle
            isChecked={apiType === "RA" && !isRoyal}
            onChange={() => {
              isRoyal && dispatch(setRoyal(false));
              dispatch(setApiType("RA"));
            }}
          />
          RetroAchievements
        </label>
        <label className={styles.consoles__toggle}>
          <Toggle
            isChecked={apiType === "IGDB" && !isRoyal}
            onChange={() => {
              isRoyal && dispatch(setRoyal(false));
              dispatch(
                setApiType(apiType === "IGDB" && !isRoyal ? "RA" : "IGDB")
              );
            }}
          />
          IGDB
        </label>
        <label className={styles.consoles__toggle}>
          <Toggle
            isChecked={isRoyal}
            onChange={() => dispatch(setRoyal(!isRoyal))}
          />
          Royal
        </label>
      </div>
      {apiType === "IGDB" && !isRoyal && (
        <IGDBList
          setSelectedGeneration={setSelectedGeneration}
          selectedRating={selectedRating}
          setSelectedRating={setSelectedRating}
          selectedGeneration={selectedGeneration}
          selectedGenres={selectedGenres}
          setSelectedGenres={setSelectedGenres}
          IGDBPlatforms={IGDBPlatforms}
          IGDBGenres={IGDBGenres}
        />
      )}
      {apiType === "RA" && !isRoyal && (
        <div className={styles.consoles__groups}>
          {consolesGroup.map((item, i) => (
            <ConsolesGroup key={i} system={item} consoles={consoles} />
          ))}
        </div>
      )}
      {isRoyal && <RoyalList />}
    </div>
  );
};

export default ConsolesList;
