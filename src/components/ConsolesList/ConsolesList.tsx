import { Dispatch, FC, SetStateAction, useEffect, useState } from "react";
import { IConsole, IGame } from "../../interfaces/responses";
import { GameList, getConsoleIds } from "@retroachievements/api";
import { authorization } from "../../utils/authorization";
import { consolesImages } from "../../utils/consoleImages";
import ConsolesGroup from "./ConsolesGroup/ConsolesGroup";
import styles from "./ConsolesList.module.scss";

interface ConsolesListProps{
  selectedSystems: number[];
  setSelectedSystems: Dispatch<SetStateAction<number[]>>;
  setGames: Dispatch<SetStateAction<IGame[]>>;
}

const ConsolesList: FC<ConsolesListProps> = ({selectedSystems,setSelectedSystems,setGames}) => {
  const [consoles, setConsoles] = useState<IConsole[]>([]);


  const fetchConsoleIds = async () => {
    const consolesIds = await getConsoleIds(authorization);
    const consolesImagesIds = consolesImages.map(image => image.id);

    const consolesWithAchievements: IConsole[] | undefined = consolesIds.filter(console=>consolesImagesIds.includes(console.id));
    setConsoles(consolesWithAchievements);
  };

  useEffect(() => {
    fetchConsoleIds();
  }, []);

  return (
    <div className={styles.consoles__list}>
        <ConsolesGroup system="Nintendo" consoles={consoles} setSelectedSystems={setSelectedSystems} selectedSystems={selectedSystems} setGames={setGames}/>
        <ConsolesGroup system="Sony" consoles={consoles} setSelectedSystems={setSelectedSystems} selectedSystems={selectedSystems} setGames={setGames}/>
        <ConsolesGroup system="Atari" consoles={consoles} setSelectedSystems={setSelectedSystems} selectedSystems={selectedSystems} setGames={setGames}/>
        <ConsolesGroup system="Sega" consoles={consoles} setSelectedSystems={setSelectedSystems} selectedSystems={selectedSystems} setGames={setGames}/>
        <ConsolesGroup system="NEC" consoles={consoles} setSelectedSystems={setSelectedSystems} selectedSystems={selectedSystems} setGames={setGames}/>
        <ConsolesGroup system="SNK" consoles={consoles} setSelectedSystems={setSelectedSystems} selectedSystems={selectedSystems} setGames={setGames}/>
        <ConsolesGroup system="Other" consoles={consoles} setSelectedSystems={setSelectedSystems} selectedSystems={selectedSystems} setGames={setGames}/>
    </div>
  );
};

export default ConsolesList;
