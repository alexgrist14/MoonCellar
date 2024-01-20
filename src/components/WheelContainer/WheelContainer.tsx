import { getGameList } from "@retroachievements/api";
import { FC } from "react";
import { authorization } from "../../utils/authorization";
import { Wheel } from "react-custom-roulette";

interface WheelContainerProps {
  selectedSystems: number[];
}

const WheelContainer: FC<WheelContainerProps> = ({ selectedSystems }) => {
  const data = [
    { option: "0", style: { backgroundColor: "green", textColor: "black" } },
    { option: "1", style: { backgroundColor: "white" } },
    { option: "5" },
    { option: "2" },
    { option: "2" },
    { option: "2" },
    { option: "2" },

  ];

  const fetchGames = async () => {
    // const gameList = await getGameList(authorization,{
    // })
  };

  return (
    <div>
      <Wheel
        mustStartSpinning={false}
        prizeNumber={10}
        data={data}
        backgroundColors={["#3e3e3e", "#df3428"]}
        textColors={["#ffffff"]}
      />
    </div>
  );
};

export default WheelContainer;
