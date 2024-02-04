import { Dispatch, FC, SetStateAction } from "react";
import { IConsole, IGame } from "../../../interfaces/responses";
import styles from "./ConsolesGroup.module.scss";
import { consolesImages } from "../../../utils/consoleImages";
import { Checkbox } from "@atlaskit/checkbox";
import { useAppDispatch, useAppSelector } from "../../../store";
import { setSystemsRA } from "../../../store/commonSlice";

interface ConsolesGroupProps {
  system: string;
  consoles: IConsole[];
  setGames: Dispatch<SetStateAction<IGame[]>>;
  fetchGameList: (
    id: number,
    setGames: Dispatch<SetStateAction<IGame[]>>
  ) => void;
}

const ConsolesGroup: FC<ConsolesGroupProps> = ({
  system,
  consoles,
  setGames,
  fetchGameList,
}) => {
  const dispatch = useAppDispatch();

  const { systemsRA } = useAppSelector((state) => state.common);

  const findConsoleNameById = (id: number): string | undefined => {
    const consoleItem = consoles.find((console) => console.id === id);
    return consoleItem ? consoleItem.name : undefined;
  };

  const handleConsoleClick = (id: number): void => {
    if (systemsRA?.includes(id)) {
      dispatch(
        setSystemsRA(systemsRA.filter((selectedId) => selectedId !== id))
      );
      setGames((prevGames) =>
        prevGames.filter((game) => game.consoleId !== id)
      );
    } else {
      dispatch(setSystemsRA(!!systemsRA?.length ? [...systemsRA, id] : [id]));
      fetchGameList(id, setGames);
    }
  };

  return (
    <div className={styles.consoles__group}>
      <h3 className={styles.title}>{system}</h3>
      {consoles?.map((console, i) =>
        consolesImages[i].system === system.toLowerCase() ? (
          <div
            className={`${styles.consoles__item} ${
              systemsRA?.includes(consolesImages[i].id) ? styles.checked : ""
            }`}
            onClick={() => handleConsoleClick(consolesImages[i].id)}
            key={i}
          >
            <div className={styles.consoles__item_title}>
              <img
                className={styles.image}
                src={consolesImages[i].image}
                alt="console"
              />
              <div className={styles.text}>
                {findConsoleNameById(consolesImages[i].id)}
              </div>
            </div>
            <Checkbox isChecked={systemsRA?.includes(consolesImages[i].id)} />
          </div>
        ) : null
      )}
    </div>
  );
};

export default ConsolesGroup;
