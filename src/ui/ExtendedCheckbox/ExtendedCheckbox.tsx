import styles from "./ExtendedCheckbox.module.scss";
import { Checkbox } from "@atlaskit/checkbox";
import { useAppDispatch } from "../../store";
import { ActionCreatorWithPayload } from "@reduxjs/toolkit";

export interface IExtendedCheckboxProps<
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

export const ExtendedCheckbox = <T,>({
  title,
  excluded,
  list,
  selected,
  setExcluded,
  setSelected,
  isDisabled,
}: IExtendedCheckboxProps<T & { id: number; name: string }>) => {
  const dispatch = useAppDispatch();

  return (
    <div className={styles.checkbox}>
      <h3>{title}</h3>
      <div className={styles.checkbox__list}>
        {list.map((element) => {
          const isExcluded = excluded?.some(
            (excluded) => excluded.id === element.id
          );

          const isSelected = selected?.some(
            (selected) => selected.id === element.id
          );

          return (
            <Checkbox
              key={element.id}
              label={element.name}
              isChecked={isSelected || isExcluded}
              isIndeterminate={isExcluded}
              isDisabled={isDisabled}
              onChange={() => {
                if (isSelected) {
                  dispatch(
                    setExcluded([...(!!excluded ? excluded : []), element])
                  );
                  dispatch(
                    setSelected(
                      selected?.filter((selected) => selected.id !== element.id)
                    )
                  );
                } else if (isExcluded) {
                  dispatch(
                    setExcluded(
                      excluded?.filter((excluded) => excluded.id !== element.id)
                    )
                  );
                } else {
                  dispatch(
                    setSelected([...(!!selected ? selected : []), element])
                  );
                }
              }}
            />
          );
        })}
      </div>
    </div>
  );
};
