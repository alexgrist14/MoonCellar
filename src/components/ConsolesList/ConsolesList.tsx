import { Dispatch, FC, SetStateAction, useEffect, useState } from "react";
import { IConsole, IGame } from "../../interfaces/responses";
import { getConsoleIds, getGameList } from "@retroachievements/api";
import { authorization } from "../../utils/authorization";
import { consolesImages } from "../../utils/consoleImages";
import ConsolesGroup from "./ConsolesGroup/ConsolesGroup";
import styles from "./ConsolesList.module.scss";
import { IGDBAgent } from "../../api";
import { AxiosResponse } from "axios";

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
  const [gamesNew, setGamesNew] = useState<any[]>([]);

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

  const getGames = (limit: number, offset: number) => {
    return IGDBAgent("https://api.igdb.com/v4/games", {
      fields:
        "name, cover, screenshots, slug, total_rating, artworks, franchise, franchises, game_modes, genres, platforms, tags, themes, url",
      limit: limit,
      offset: offset,
      where: "parent_game = null",
    });
  };

  useEffect(() => {
    const queries: Promise<AxiosResponse>[] = [];
    const maxRetries = 5;

    let attempt = 0;

    for (let i = 0; i < 2; i++) {
      queries.push(getGames(500, 500 * i));
    }

    const hui = async (queries: Promise<AxiosResponse>[]) => {
      const results: any[] = await Promise.allSettled(queries);
      console.log(results);

      const retryPromises: Promise<AxiosResponse>[] = [];
      const successResults: any[] = [];

      results.forEach((result) =>
        result.status === "rejected"
          ? retryPromises.push(
              getGames(
                result.reason.config.params.limit,
                result.reason.config.params.offset
              )
            )
          : successResults.push(result)
      );

      setGamesNew((games) => {
        return Array.from(
          new Set(
            games.concat(...successResults.map((result) => result.value.data))
          )
        );
      });

      console.log(retryPromises);

      if (!!retryPromises?.length) {
        attempt++;
        attempt <= maxRetries && hui(retryPromises);
      }
    };

    hui(queries);
  }, []);

  console.log(gamesNew);

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
