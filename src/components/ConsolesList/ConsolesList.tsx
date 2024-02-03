import { Dispatch, FC, SetStateAction, useEffect, useState } from "react";
import { IConsole, IGame } from "../../interfaces/responses";
import { getConsoleIds, getGameList } from "@retroachievements/api";
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
import { setApiType, setLoading } from "../../store/commonSlice";

interface ConsolesListProps {
  selectedSystems: number[];
  setSelectedSystems: Dispatch<SetStateAction<number[]>>;
  selectedRating: number;
  setSelectedRating: Dispatch<SetStateAction<number>>;
  selectedGenres: number[];
  setSelectedGenres: Dispatch<SetStateAction<number[]>>;
  setGames: Dispatch<SetStateAction<IGame[]>>;
}

const ConsolesList: FC<ConsolesListProps> = ({
  selectedSystems,
  setSelectedSystems,
  selectedRating,
  setSelectedRating,
  selectedGenres,
  setSelectedGenres,
  setGames,
}) => {
  const dispatch = useAppDispatch();
  const { isLoading, apiType } = useAppSelector((state) => state.common);

  const [IGDBPlatforms, setIGDBPlatforms] = useState<IIGDBPlatform[]>([]);
  const [IGDBGenres, setIGDBGenres] = useState<IIGDBGenre[]>([]);

  const [selectedGeneration, setSelectedGeneration] = useState<number>(0);

  const [consoles, setConsoles] = useState<IConsole[]>([]);

  const fetchGameList = async (
    id: number,
    setGames: Dispatch<SetStateAction<IGame[]>>
  ) => {
    const gameList = (await getGameList(authorization, {
      consoleId: id,
      shouldOnlyRetrieveGamesWithAchievements: true,
    })) as IGame[];

    const gameListWithoutSubstets = gameList
      .filter((game) => !game.title.includes("~"))
      .filter((game) => !game.title.includes("Subset"));

    setGames((prevState) => [...prevState, ...gameListWithoutSubstets]);
  };

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
    fetchConsoleIds();
    getGenres(setIGDBGenres);
  }, []);

  useEffect(() => {
    dispatch(setLoading(true));

    getPlatforms(setIGDBPlatforms, selectedGeneration);
  }, [selectedGeneration, dispatch]);

  return (
    <div className={styles.consoles__list}>
      <div className={styles.consoles__options}>
        <label className={styles.consoles__toggle}>
          RetroAchievements
          <Toggle
            isChecked={apiType === "IGDB"}
            onChange={() =>
              dispatch(setApiType(apiType === "RA" ? "IGDB" : "RA"))
            }
          />
          IGDB
        </label>
      </div>
      {apiType === "IGDB" && (
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
                isChecked={selectedSystems.includes(platform.id)}
                isDisabled={isLoading}
                onChange={() =>
                  setSelectedSystems(
                    !selectedSystems.includes(platform.id)
                      ? [...selectedSystems, platform.id]
                      : selectedSystems.filter((id) => id !== platform.id)
                  )
                }
              />
            ))}
          </div>
        </div>
      )}
      {apiType === "RA" && (
        <div className={styles.consoles__groups}>
          <ConsolesGroup
            system="Nintendo"
            consoles={consoles}
            setSelectedSystems={setSelectedSystems}
            selectedSystems={selectedSystems}
            setGames={setGames}
            fetchGameList={fetchGameList}
          />
          <ConsolesGroup
            system="Sony"
            consoles={consoles}
            setSelectedSystems={setSelectedSystems}
            selectedSystems={selectedSystems}
            setGames={setGames}
            fetchGameList={fetchGameList}
          />
          <ConsolesGroup
            system="Atari"
            consoles={consoles}
            setSelectedSystems={setSelectedSystems}
            selectedSystems={selectedSystems}
            setGames={setGames}
            fetchGameList={fetchGameList}
          />
          <ConsolesGroup
            system="Sega"
            consoles={consoles}
            setSelectedSystems={setSelectedSystems}
            selectedSystems={selectedSystems}
            setGames={setGames}
            fetchGameList={fetchGameList}
          />
          <ConsolesGroup
            system="NEC"
            consoles={consoles}
            setSelectedSystems={setSelectedSystems}
            selectedSystems={selectedSystems}
            setGames={setGames}
            fetchGameList={fetchGameList}
          />
          <ConsolesGroup
            system="SNK"
            consoles={consoles}
            setSelectedSystems={setSelectedSystems}
            selectedSystems={selectedSystems}
            setGames={setGames}
            fetchGameList={fetchGameList}
          />
          <ConsolesGroup
            system="Other"
            consoles={consoles}
            setSelectedSystems={setSelectedSystems}
            selectedSystems={selectedSystems}
            setGames={setGames}
            fetchGameList={fetchGameList}
          />
        </div>
      )}
    </div>
  );
};

export default ConsolesList;
