import { FC, ReactNode, useState } from "react";
import { IGame } from "../../interfaces/responses";
import "react-wheel-of-prizes/dist/index.css";
import WheelComponent from "./WheelComponent";
import styles from "./WheelContainer.module.scss";
import helen from "../../assets/helen.png";

interface WheelContainerProps {
  games: IGame[];
}

const WheelContainer: FC<WheelContainerProps> = ({ games }) => {
  const [currentWinner, setCurrentWinner] = useState<string | ReactNode>();

  const segColors = [
    "#EE4040",
    "#F0CF50",
    "#815CD1",
    "#3DA5E0",
    "#34A24F",
    "#F9AA1F",
    "#EC3F3F",
    "#FF9000",
    "#F0CF50",
    "#815CD1",
    "#3DA5E0",
    "#34A24F",
    "#F9AA1F",
    "#EC3F3F",
    "#FF9000",
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
        setCurrentWinner={setCurrentWinner}
      />
      {currentWinner && (
        <div className={styles.winner}>
          <div className={styles.winner__container}>
            {typeof currentWinner === typeof "str" ?
            <img className={styles.img} src={helen} alt="helen" />
            :
            ""
          }
            
            <div>
            {currentWinner}

            </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default WheelContainer;
