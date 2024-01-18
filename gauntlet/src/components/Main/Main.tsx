import { FC, useEffect } from "react";
import {
  buildAuthorization,
  getConsoleIds,
  getGame,
  getGameList,
} from "@retroachievements/api";
import "./Main.css";
import { IAuth, IPayload } from "../../interfaces/responses";
import { useAppDispatch } from "../../store";
import { setAuth } from "../../store/authSlice";

const userName = "alexgrist14";
const webApiKey = process.env.REACT_APP_RETROACHIEVEMENTS_API_KEY || "fail";

const authorization:IAuth = buildAuthorization({ userName, webApiKey });


const Main: FC = () => {

  const dispatch = useAppDispatch();

  const getGamesById = async () => {
    const game = await getGame(authorization, { gameId: 14402 });
    return game;
  };

  const fetchConsoleIds = async () => {
    const consolesIds = await getConsoleIds(authorization);
    const payload: IPayload = {
      consoleId: 1,
      shouldOnlyRetrieveGamesWithAchievements: true,
    };
    const gameList = getGameList(authorization, payload);
    return consolesIds;
  };

  const a = async () => {
    const b = await fetchConsoleIds();
    console.log(authorization);
  };

  useEffect(() => {
    a();
    dispatch(setAuth({userName: authorization.userName, webApiKey: authorization.webApiKey}));
  }, []);

  return <div className="App"></div>;
};

export default Main;
