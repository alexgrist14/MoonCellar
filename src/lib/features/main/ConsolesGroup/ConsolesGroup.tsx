import { FC } from "react";
import styles from "./ConsolesGroup.module.scss";
import { useAppDispatch, useAppSelector } from "@/src/lib/app/store";
import { consolesImages } from "@/src/lib/shared/utils/consoleImages";
import { setSelectedSystemsRA } from "@/src/lib/app/store/slices/selectedSlice";
import { Dropdown } from "@/src/lib/shared/ui/Dropdown";

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
      <Dropdown
        isCompact
        isDisabled={isLoading}
        isMulti
        placeholder="Select systems..."
        overflowRootId="consoles"
        list={filteredSystems.map((system) => system.name)}
        overwriteValue={filteredSelectedSystems
          .map((system) => system.name)
          .join(", ")}
        initialMultiValue={filteredSelectedSystems.map((system) =>
          filteredSystems.findIndex((sys) => sys.id === system.id)
        )}
        getIndexes={(indexes) =>
          dispatch(
            setSelectedSystemsRA([
              ...otherSelectedSystems,
              ...indexes.map((index) => filteredSystems[index]),
            ])
          )
        }
      />
    </div>
  );
};
