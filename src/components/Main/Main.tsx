import { FC, useState } from "react";

import ConsolesList from "../ConsolesList/ConsolesList";
import WheelContainer from "../WheelContainer/WheelContainer";
import { IGame } from "../../interfaces/responses";
import styles from "./Main.module.scss";

const Main: FC = () => {
  const [games,setGames] = useState<IGame[]>([]);
  const [selectedSystems, setSelectedSystems] = useState<number[]>([]);

  return (
    <div className={styles.App}>
      <ConsolesList selectedSystems={selectedSystems} setSelectedSystems={setSelectedSystems} setGames={setGames}/>
      <WheelContainer games={games}/>
    </div>
  );
};

export default Main;
