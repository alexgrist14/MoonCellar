import { FC, ReactNode, useState } from "react";
import { IGame } from "../../interfaces/responses";
import "react-wheel-of-prizes/dist/index.css";
import WheelComponent from "./WheelComponent";
import styles from "./WheelContainer.module.scss";
import { IIGDBGame } from "../../interfaces";

interface WheelContainerProps {
  games: IGame[];
  gamesIGDB: IIGDBGame[];
  callback: () => void;
}

const WheelContainer: FC<WheelContainerProps> = ({
  games,
  gamesIGDB,
  callback,
}) => {
  const [currentWinner, setCurrentWinner] = useState<string | ReactNode>();

  const segColors = [
    "#815CD1",
    "#3DA5E0",
  ];

  return (
    <div className={styles.container}>
      <WheelComponent
        segColors={segColors}
        primaryColor="black"
        contrastColor="white"
        buttonText="Spin"
        size={295}
        upDuration={100}
        downDuration={300}
        games={games}
        gamesIGDB={gamesIGDB}
        setCurrentWinner={setCurrentWinner}
        callback={callback}
      />
      {currentWinner && (
        <div className={styles.winner}>
          <div className={styles.winner__container}>
            <div>{currentWinner}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WheelContainer;
