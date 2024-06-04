import styles from "./ExtendedSelector.module.scss";
import { ActionCreatorWithPayload } from "@reduxjs/toolkit";
import { useAppDispatch } from "@/src/lib/app/store";
import { Dropdown } from "../Dropdown";

export interface IExtendedSelectorProps<
  T extends { id: number; name: string }
> {
  title: string;
  list: T[];
  excluded: T[];
  selected: T[];
  setExcluded: ActionCreatorWithPayload<T[]>;
  setSelected: ActionCreatorWithPayload<T[]>;
  isDisabled?: boolean;
}

export const ExtendedSelector = <T,>({
  title,
  excluded,
  list,
  selected,
  setExcluded,
  setSelected,
  isDisabled,
}: IExtendedSelectorProps<T & { id: number; name: string }>) => {
  const dispatch = useAppDispatch();

  return (
    <div className={styles.option}>
      <h3>{title}</h3>
      <div className={styles.option__selector}>
        <Dropdown
          overflowRootId="consoles"
          isCompact
          isWithReset
          isDisabled={isDisabled}
          list={list.map((item) => item.name)}
          wrapperStyle={{ width: "100%" }}
          borderTheme="green"
          isMulti
          isWithSearch
          overwriteValue={selected.map((item) => item.name).join(", ")}
          initialMultiValue={selected.map((item) =>
            list.findIndex((el) => el.id === item.id)
          )}
          placeholder="Include..."
          getIndexes={(indexes) =>
            dispatch(setSelected(indexes.map((index) => list[index])))
          }
        />
      </div>
      <div className={styles.option__selector}>
        <Dropdown
          overflowRootId="consoles"
          isCompact
          isWithReset
          isDisabled={isDisabled}
          list={list.map((item) => item.name)}
          wrapperStyle={{ width: "100%" }}
          borderTheme="red"
          isMulti
          isWithSearch
          overwriteValue={excluded.map((item) => item.name).join(", ")}
          initialMultiValue={excluded.map((item) =>
            list.findIndex((el) => el.id === item.id)
          )}
          placeholder="Exclude..."
          getIndexes={(indexes) =>
            dispatch(setExcluded(indexes.map((index) => list[index])))
          }
        />
      </div>
    </div>
  );
};
