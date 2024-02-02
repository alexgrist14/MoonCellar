import { Dispatch, FC, SetStateAction, useEffect, useState } from "react";
import { IConsole, IGame } from "../../interfaces/responses";
import { getConsoleIds, getGameList } from "@retroachievements/api";
import { authorization } from "../../utils/authorization";
import { consolesImages } from "../../utils/consoleImages";
import ConsolesGroup from "./ConsolesGroup/ConsolesGroup";
import styles from "./ConsolesList.module.scss";
import { IGDBAgent } from "../../api";

interface ConsolesListProps {
  selectedSystems: number[];
  setSelectedSystems: Dispatch<SetStateAction<number[]>>;
  setGames: Dispatch<SetStateAction<IGame[]>>;
}

const ConsolesList: FC<ConsolesListProps> = ({
  selectedSystems,
  setSelectedSystems,
  setGames,
}) => {
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

  useEffect(() => {
    fetchConsoleIds();
  }, []);

  // IGDBAgent("https://api.igdb.com/v4/platforms", { fields: "name, platform_logo", limit: 500 }).then(
  //   (response) => console.log(response.data)
  // );

  IGDBAgent("https://api.igdb.com/v4/games", { fields: "name, aggregated_rating", limit: 500, where: "id = 1942"}).then(
    (response) => console.log(response.data)
  );

  return (
    <div className={styles.consoles__list}>
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
  );
};

export default ConsolesList;
