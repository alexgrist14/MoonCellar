import { getGameList } from "@retroachievements/api";
import { FC, useEffect, useState } from "react";
import { authorization } from "../../utils/authorization";
import { Wheel } from "react-custom-roulette";
import { IGame } from "../../interfaces/responses";
import "react-wheel-of-prizes/dist/index.css";
import WheelComponent from "./WheelComponent";

interface WheelContainerProps {
  selectedSystems: number[];
  games: IGame[];
}

const WheelContainer: FC<WheelContainerProps> = ({
  selectedSystems,
  games,
}) => {
  const [gamesForSpin, setGamesForSpin] = useState<string[]>([]);
  const [forceUpdateKey, setForceUpdateKey] = useState(0);
  const [currentWinner,setCurrentWinner] = useState<string>("");

  useEffect(() => {
    if (games.length > 0) {
      const randomGames = Array.from({ length: 15 }, (_, index) => {
        const randomIndex = Math.floor(Math.random() * games.length);
        return games[randomIndex].title;
      });
      setGamesForSpin(randomGames);
    }
  }, [games]);

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
  const onFinished = (winner: any) => {
    //console.log(winner)
  };

  useEffect(() => {
    setForceUpdateKey((prev) => prev + 1);
  }, [gamesForSpin]);

  return (
    <div>
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
        size={290}
        upDuration={10}
        downDuration={100}
      />
      <div>{currentWinner}</div>
    </div>
  );
};

export default WheelContainer;
