import { FC, useState } from "react";

import ConsolesList from "../ConsolesList/ConsolesList";
import Wheel from "../Wheel/Wheel";

const Main: FC = () => {
  const [selectedSystems, setSelectedSystems] = useState<number[]>([]);
  return (
    <div className="App">
      <ConsolesList selectedSystems={selectedSystems} setSelectedSystems={setSelectedSystems}/>
      <Wheel selectedSystems={selectedSystems}/>
    </div>
  );
};

export default Main;
