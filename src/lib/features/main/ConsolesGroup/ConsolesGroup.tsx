import { FC } from "react";
import styles from "./ConsolesGroup.module.scss";
import Select from "react-select";
import classNames from "classnames";
import { useAppDispatch, useAppSelector } from "@/src/lib/app/store";
import { consolesImages } from "@/src/lib/shared/utils/consoleImages";
import { selectStyles } from "@/src/lib/shared/constants";
import { setSelectedSystemsRA } from "@/src/lib/app/store/slices/selectedSlice";

interface ConsolesGroupProps {
  system: string;
}

export const ConsolesGroup: FC<ConsolesGroupProps> = ({ system }) => {
  const dispatch = useAppDispatch();

  const { systemsRA } = useAppSelector((state) => state.common);
  const { selectedSystemsRA } = useAppSelector((state) => state.selected);
  const { isLoading } = useAppSelector((state) => state.states);

  const filteredSystems = systemsRA.filter(
    (console) =>
      consolesImages.find((image) => image.id === console.id)?.system ===
      system.toLowerCase()
  );

  const otherSelectedSystems = selectedSystemsRA.filter(
    (console) =>
      consolesImages.find((image) => image.id === console.id)?.system !==
      system.toLowerCase()
  );

  const filteredSelectedSystems = selectedSystemsRA.filter(
    (console) =>
      consolesImages.find((image) => image.id === console.id)?.system ===
      system.toLowerCase()
  );

  return (
    <div className={styles.consoles__group}>
      <h3 className={styles.title}>{system}</h3>
      <Select
        className={classNames({ [styles.consoles_disabled]: isLoading })}
        isMulti
        placeholder="Select systems..."
        closeMenuOnSelect={false}
        maxMenuHeight={250}
        menuPlacement="top"
        defaultValue={filteredSelectedSystems.map((system) => {
          const image = consolesImages.find((image) => image.id === system.id);
          return {
            label: system.name,
            value: JSON.stringify(system),
            ...(!!image && { image: image?.image }),
          };
        })}
        options={filteredSystems.map((system) => {
          const image = consolesImages.find((image) => image.id === system.id);
          return {
            label: system.name,
            value: JSON.stringify(system),
            ...(!!image && { image: image?.image }),
          };
        })}
        styles={{ ...selectStyles<string>("default") }}
        onChange={(selected) => {
          dispatch(
            setSelectedSystemsRA([
              ...otherSelectedSystems,
              ...selected.map((item) => JSON.parse(item.value)),
            ])
          );
        }}
      />
    </div>
  );
};
