import { ChangeEvent, Dispatch, FC, SetStateAction, useState } from "react";
import { IConsole, IGame } from "../../../interfaces/responses";
import styles from "./ConsolesGroup.module.scss";
import { consolesImages } from "../../../utils/consoleImages";
import { getGameList } from "@retroachievements/api";
import { authorization } from "../../../utils/authorization";
import { Checkbox } from "@atlaskit/checkbox";

interface ConsolesGroupProps {
  system: string;
  consoles: IConsole[];
  setSelectedSystems: Dispatch<SetStateAction<number[]>>;
  setGames: Dispatch<SetStateAction<IGame[]>>;
  selectedSystems: number[];
}

const ConsolesGroup: FC<ConsolesGroupProps> = ({
  system,
  consoles,
  setSelectedSystems,
  selectedSystems,
  setGames,
}) => {
  const findConsoleNameById = (id: number): string | undefined => {
    const consoleItem = consoles.find((console) => console.id === id);
    return consoleItem ? consoleItem.name : undefined;
  };

  const fetchGameList = async (id: number) => {
    const gameList: any = await getGameList(authorization, {
      consoleId: id,
      shouldOnlyRetrieveGamesWithAchievements: true,
    });
    console.log(gameList)
    setGames((prevState)=> [...prevState,...gameList]);
  };

  const handleCheckboxChange = (id: number, isChecked: boolean) => {
    if (isChecked) {
      setSelectedSystems((prevSelectedSystems) => [...prevSelectedSystems, id]);

      fetchGameList(id);
    } else {
      setSelectedSystems((prevSelectedSystems) =>
        prevSelectedSystems.filter((selectedId) => selectedId !== id)
      );
      setGames((prevGames) =>
        prevGames.filter((game) => game.consoleId !== id)
      );
    }
  };

  return (
    <div className={styles.consoles__group}>
      <h3 className={styles.title}>{system}</h3>
      {consoles?.map((console, i) =>
        consolesImages[i].system === system.toLowerCase() ? (
          <div
            className={`${styles.consoles__item} ${
              selectedSystems.includes(consolesImages[i].id)
                ? styles.checked
                : ""
            }`}
            key={i}
          >
            <img
              className={styles.image}
              src={consolesImages[i].image}
              alt="console"
            />
            <div className={styles.text}>
              {findConsoleNameById(consolesImages[i].id)}
            </div>
            <Checkbox
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                handleCheckboxChange(consolesImages[i].id, e.target.checked)
              }
            />
          </div>
        ) : null
      )}
    </div>
  );
};

export default ConsolesGroup;
