import {
  Dispatch,
  FC,
  SetStateAction,
  useEffect,
  useRef,
  useState,
} from "react";
import { IConsole } from "../../interfaces/responses";
import { getConsoleIds } from "@retroachievements/api";
import { authorization } from "../../utils/authorization";
import { consolesImages } from "../../utils/consoleImages";
import ConsolesGroup from "./ConsolesGroup/ConsolesGroup";
import styles from "./ConsolesList.module.scss";
import { Checkbox } from "@atlaskit/checkbox";
import Range from "@atlaskit/range";
import Toggle from "@atlaskit/toggle";
import { IIGDBGenre, IIGDBPlatform } from "../../interfaces";
import { getGenres, getPlatforms } from "../../utils/IGDB";
import { useDebouncedCallback } from "use-debounce";
import { useAppDispatch, useAppSelector } from "../../store";
import {
  setApiType,
  setRoyal,
  setRoyalGames,
  setSystemsIGDB,
} from "../../store/commonSlice";
import { setLoading } from "../../store/statesSlice";
import { fetchGameList } from "../../utils/getGames";

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
  const { apiType, royalGames, systemsIGDB, systemsRA, isRoyal } =
    useAppSelector((state) => state.common);
  const { isLoading } = useAppSelector((state) => state.states);
  const { token } = useAppSelector((state) => state.auth);

  const firstRender = useRef(true);

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

  const debouncedSetGeneration = useDebouncedCallback(
    (number: number) => setSelectedGeneration(number),
    500
  );

  const debouncedSetRating = useDebouncedCallback(
    (number: number) => setSelectedRating(number),
    500
  );

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
        <div className={styles.consoles__igdb}>
          <h3>Rating</h3>
          <div className={styles.consoles__generations}>
            <Range
              defaultValue={selectedRating}
              min={0}
              max={99}
              step={1}
              type="range"
              onChange={(value) => debouncedSetRating(value)}
              isDisabled={isLoading}
            />
            <span>{!!selectedRating ? ">= " + selectedRating : "All"}</span>
          </div>
          <h3>Generations</h3>
          <div className={styles.consoles__generations}>
            <Range
              defaultValue={selectedGeneration}
              min={0}
              max={9}
              type="range"
              onChange={(value) => debouncedSetGeneration(value)}
              isDisabled={isLoading}
            />
            <span>
              {!!selectedGeneration ? "0 - " + selectedGeneration : "All"}
            </span>
          </div>
          <h3>Genres</h3>
          <div className={styles.consoles__families}>
            {IGDBGenres.map((genre) => (
              <Checkbox
                key={genre.id}
                label={genre.name}
                isChecked={selectedGenres.includes(genre.id)}
                isDisabled={isLoading}
                onChange={() =>
                  setSelectedGenres(
                    !selectedGenres.includes(genre.id)
                      ? [...selectedGenres, genre.id]
                      : selectedGenres.filter((id) => id !== genre.id)
                  )
                }
              />
            ))}
          </div>
          <h3>Platforms</h3>
          <div className={styles.consoles__platforms}>
            {IGDBPlatforms.map((platform) => (
              <Checkbox
                key={platform.id}
                label={platform.name}
                isChecked={systemsIGDB?.includes(platform.id)}
                isDisabled={isLoading}
                onChange={() =>
                  dispatch(
                    setSystemsIGDB(
                      !!systemsIGDB?.length
                        ? !systemsIGDB?.includes(platform.id)
                          ? [...systemsIGDB, platform.id]
                          : systemsIGDB.filter((id) => id !== platform.id)
                        : [platform.id]
                    )
                  )
                }
              />
            ))}
          </div>
        </div>
      )}
      {isRoyal && (
        <div className={styles.consoles__royal}>
          <h3>Games:</h3>
          <div className={styles.consoles__games}>
            {!!royalGames?.length
              ? royalGames.map((game) => (
                  <div key={game.id} className={styles.consoles__game}>
                    <a
                      href={`https://retroachievements.org/game/${game.id}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {game.name}
                    </a>
                    <button
                      onClick={() =>
                        dispatch(
                          setRoyalGames(
                            royalGames.filter((_game) => game.id !== _game.id)
                          )
                        )
                      }
                    >
                      Remove
                    </button>
                  </div>
                ))
              : null}
          </div>
        </div>
      )}
      {apiType === "RA" && !isRoyal && (
        <div className={styles.consoles__groups}>
          {consolesGroup.map((item, i) => (
            <ConsolesGroup key={i} system={item} consoles={consoles} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ConsolesList;
