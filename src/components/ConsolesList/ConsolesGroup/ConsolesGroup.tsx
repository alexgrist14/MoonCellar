import { Dispatch, FC, SetStateAction, useState } from "react";
import { IConsole } from "../../../interfaces/responses";
import styles from "./ConsolesGroup.module.scss";
import { consolesImages } from "../../../utils/consoleImages";

interface ConsolesGroupProps {
  system: string;
  consoles: IConsole[];
  setSelectedSystems: Dispatch<SetStateAction<number[]>>;
  selectedSystems: number[];
}

const ConsolesGroup: FC<ConsolesGroupProps> = ({ system, consoles,setSelectedSystems,selectedSystems }) => {

  const findConsoleNameById = (id: number): string | undefined => {
    const consoleItem = consoles.find((console) => console.id === id);
    return consoleItem ? consoleItem.name : undefined;
  };

  const handleCheckboxChange = (id:number)=>{
    const isSelected = selectedSystems.includes(id);
    if (isSelected) {
      setSelectedSystems((prevSelectedSystems) =>
        prevSelectedSystems.filter((selectedId) => selectedId !== id)
      );
    } else {
      setSelectedSystems((prevSelectedSystems) => [...prevSelectedSystems, id]);
    }
  }

  return (
    <div className={styles.consoles__group}>
      <h3 className={styles.title}>{system}</h3>
      {consoles?.map((console, i) => (
          consolesImages[i].system === system.toLowerCase() ? (
            <div className={`${styles.consoles__item} ${selectedSystems.includes(consolesImages[i].id) ? styles.checked : ""}`} onClick={()=>handleCheckboxChange(consolesImages[i].id)} key={i}>
              <img
                className={styles.image}
                src={consolesImages[i].image}
                alt="console"
              />
              <div className={styles.text}>
                {findConsoleNameById(consolesImages[i].id)}
              </div>
            </div>
          ) : null
      ))}
    </div>
  );
};

export default ConsolesGroup;
