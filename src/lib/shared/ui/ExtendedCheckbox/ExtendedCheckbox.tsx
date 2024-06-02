import { useAppDispatch } from "@/src/lib/app/store";
import styles from "./ExtendedCheckbox.module.scss";
import { ActionCreatorWithPayload } from "@reduxjs/toolkit";
import classNames from "classnames";

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
        {list.map((element, i) => {
          const isExcluded = excluded?.some(
            (excluded) => excluded.id === element.id
          );

          const isSelected = selected?.some(
            (selected) => selected.id === element.id
          );

          return (
            <div
              key={i}
              className={classNames(styles.checkbox__element, {
                [styles.checkbox__element_excluded]: isExcluded,
                [styles.checkbox__element_selected]: isSelected,
              })}
            >
              {element.name}
              <input
                type="checkbox"
                key={element.id}
                checked={isSelected || isExcluded}
                disabled={isDisabled}
                onChange={() => {
                  if (isSelected) {
                    dispatch(
                      setExcluded([...(!!excluded ? excluded : []), element])
                    );
                    dispatch(
                      setSelected(
                        selected?.filter(
                          (selected) => selected.id !== element.id
                        )
                      )
                    );
                  } else if (isExcluded) {
                    dispatch(
                      setExcluded(
                        excluded?.filter(
                          (excluded) => excluded.id !== element.id
                        )
                      )
                    );
                  } else {
                    dispatch(
                      setSelected([...(!!selected ? selected : []), element])
                    );
                  }
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
