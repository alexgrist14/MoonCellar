import { FC, useState } from "react";

import ConsolesList from "../ConsolesList/ConsolesList";
import WheelContainer from "../WheelContainer/WheelContainer";
import { IGame } from "../../interfaces/responses";
import { GameList } from "@retroachievements/api";

const Main: FC = () => {
  const [games,setGames] = useState<IGame[]>([]);
  const [selectedSystems, setSelectedSystems] = useState<number[]>([]);
  return (
    <div className="App">
      <ConsolesList selectedSystems={selectedSystems} setSelectedSystems={setSelectedSystems} setGames={setGames}/>
      <WheelContainer games={games} selectedSystems={selectedSystems}/>
    </div>
  );
};

export default Main;
