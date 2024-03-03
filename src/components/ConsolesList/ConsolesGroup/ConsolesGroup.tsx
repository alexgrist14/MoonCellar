import { FC } from "react";
import { IConsole } from "../../../interfaces/responses";
import styles from "./ConsolesGroup.module.scss";
import { consolesImages } from "../../../utils/consoleImages";
import { Checkbox } from "@atlaskit/checkbox";
import { useAppDispatch, useAppSelector } from "../../../store";
import { setSelectedSystemsRA } from "../../../store/selectedSlice";

interface ConsolesGroupProps {
  system: string;
}

const ConsolesGroup: FC<ConsolesGroupProps> = ({ system }) => {
  const dispatch = useAppDispatch();

  const { systemsRA } = useAppSelector((state) => state.common);
  const { selectedSystemsRA } = useAppSelector((state) => state.selected);

  const handleConsoleClick = (console: IConsole): void => {
    if (selectedSystemsRA?.some((system) => system.id === console.id)) {
      dispatch(
        setSelectedSystemsRA(
          selectedSystemsRA.filter((system) => system.id !== console.id)
        )
      );
    } else {
      dispatch(
        setSelectedSystemsRA(
          !!selectedSystemsRA?.length
            ? [...selectedSystemsRA, console]
            : [console]
        )
      );
    }
  };

  return (
    <div className={styles.consoles__group}>
      <h3 className={styles.title}>{system}</h3>
      {systemsRA?.map((console, i) => {
        const image = consolesImages.find((image) => image.id === console.id);

        return image?.system === system.toLowerCase() ? (
          <div
            className={`${styles.consoles__item} ${
              selectedSystemsRA?.some((system) => system.id === console.id)
                ? styles.checked
                : ""
            }`}
            onClick={() => handleConsoleClick(console)}
            key={i}
          >
            <div className={styles.consoles__item_title}>
              <img
                className={styles.image}
                src={image?.image || ""}
                alt="console"
              />
              <div className={styles.text}>{console.name}</div>
            </div>
            <Checkbox
              isChecked={selectedSystemsRA?.some(
                (system) => system.id === console.id
              )}
            />
          </div>
        ) : null;
      })}
    </div>
  );
};

export default ConsolesGroup;
