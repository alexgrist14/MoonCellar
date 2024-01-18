import { FC, useState } from "react";
import { IConsole } from "../../interfaces/responses";
import { getConsoleIds } from "@retroachievements/api";

const ConsolesList:FC = () =>{
    const [consoles,setConsoles] = useState<IConsole>();


    // const fetchConsoleIds = async () => {
    //     const consolesIds = await getConsoleIds(authorization);

    //     return consolesIds;
    // };


    

    return (
        <div>

        </div>
    )
}

export default ConsolesList;