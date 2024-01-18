import { Dispatch, FC, SetStateAction, useEffect, useState } from "react";
import { IConsole } from "../../interfaces/responses";
import { getConsoleIds } from "@retroachievements/api";
import { authorization } from "../../utils/autorization";
import { consolesImages } from "../../utils/consoleImages";
import ConsolesGroup from "./ConsolesGroup/ConsolesGroup";
import styles from "./ConsolesList.module.scss";

interface ConsolesListProps{
  selectedSystems: number[];
  setSelectedSystems: Dispatch<SetStateAction<number[]>>;
}

const ConsolesList: FC<ConsolesListProps> = ({selectedSystems,setSelectedSystems}) => {
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
        <ConsolesGroup system="Nintendo" consoles={consoles} setSelectedSystems={setSelectedSystems} selectedSystems={selectedSystems}/>
        <ConsolesGroup system="Sony" consoles={consoles} setSelectedSystems={setSelectedSystems} selectedSystems={selectedSystems}/>
        <ConsolesGroup system="Atari" consoles={consoles} setSelectedSystems={setSelectedSystems} selectedSystems={selectedSystems}/>
        <ConsolesGroup system="Sega" consoles={consoles} setSelectedSystems={setSelectedSystems} selectedSystems={selectedSystems}/>
        <ConsolesGroup system="NEC" consoles={consoles} setSelectedSystems={setSelectedSystems} selectedSystems={selectedSystems}/>
        <ConsolesGroup system="SNK" consoles={consoles} setSelectedSystems={setSelectedSystems} selectedSystems={selectedSystems}/>
        <ConsolesGroup system="Other" consoles={consoles} setSelectedSystems={setSelectedSystems} selectedSystems={selectedSystems}/>
    </div>
  );
};

export default ConsolesList;
