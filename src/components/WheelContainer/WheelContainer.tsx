import { FC, ReactElement, useEffect, useState } from "react";
import { IGame } from "../../interfaces/responses";
import "react-wheel-of-prizes/dist/index.css";
import WheelComponent from "./WheelComponent";
import styles from "./WheelContainer.module.scss";

interface WheelContainerProps {
  games: IGame[];
}

const WheelContainer: FC<WheelContainerProps> = ({
  games
}) => {
  const [gamesForSpin, setGamesForSpin] = useState<string[]>([]);
  const [forceUpdateKey, setForceUpdateKey] = useState(0);
  const [currentWinner, setCurrentWinner] = useState<string | ReactElement>("");

  useEffect(() => {
    setRandomGames();
  }, [games]);

  const setRandomGames = () =>{
   
    if (games.length > 0) {
      const randomIndices: number[] = [];
      while (randomIndices.length < 15) {
        const randomIndex = Math.floor(Math.random() * games.length);
        if (!randomIndices.includes(randomIndex)) {
          randomIndices.push(randomIndex);
        }
      }
      setGamesForSpin(randomIndices.map((index) => games[index].title));
    }
  }

  const segments = [
    "better luck next time",
    "won 70",
    "won 10",
    "better luck next time",
    "won 2",
    "won uber pass",
    "better luck next time",
    "won a voucher",
    "won 70",
    "won 10",
    "better luck next time",
    "won 2",
    "won uber pass",
    "better luck next time",
    "won a voucher",
  ];
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
  const onFinished = (winner: string) => {
    setCurrentWinner(
      <div className={styles.winner__content}>
        <img 
          className={styles.img}
          src={`https://retroachievements.org${
            findGameIdByTitle(winner)?.image
          }`}
          alt="game"
        />
        <a
          className={styles.link}
          href={`https://retroachievements.org/game/${
            findGameIdByTitle(winner)?.id
          }`}
          target="_blank"
          rel="noreferrer"
        >
          {winner}
        </a>
      </div>
    );
  };

  const findGameIdByTitle = (
    title: string
  ): { id: number; image: string } | undefined => {
    const foundGame = games.find((game) => game.title === title);
    return foundGame
      ? { id: foundGame.id, image: foundGame.imageIcon }
      : undefined;
  };

  useEffect(() => {
    setForceUpdateKey((prev) => prev + 1);
  }, [gamesForSpin]);

  return (
    <div className={styles.container}>
      <WheelComponent
        key={forceUpdateKey}
        setCurrentWinner={setCurrentWinner}
        segments={gamesForSpin}
        segColors={segColors}
        onFinished={(winner) => onFinished(winner)}
        primaryColor="black"
        contrastColor="white"
        buttonText="Spin"
        isOnlyOnce={false}
        size={295}
        upDuration={10}
        downDuration={100}
        onClick={setRandomGames}
        
      />
      <div className={styles.winner}>
        <div className={styles.winner__container}>{currentWinner}</div>
      </div>
      <button id={"spin"}>Spin</button>
    </div>
  );
};

export default WheelContainer;
