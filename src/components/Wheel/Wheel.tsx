import { getGameList } from "@retroachievements/api";
import { FC } from "react";
import { authorization } from "../../utils/autorization";

interface WheelProps{
    selectedSystems:number[];
}

const Wheel:FC<WheelProps> = ({selectedSystems})=>{
    const fetchGames = async()=>{
        // const gameList = await getGameList(authorization,{
            
        // })
    }

    return (
        <div>

        </div>
    )
}

export default Wheel;