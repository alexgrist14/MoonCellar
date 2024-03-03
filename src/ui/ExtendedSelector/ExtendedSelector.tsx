import styles from "./ExtendedSelector.module.scss";
import Select from "react-select";
import { useAppDispatch } from "../../store";
import { multiSelectStyles } from "../../constants";
import { ActionCreatorWithPayload } from "@reduxjs/toolkit";

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
  isLoading?: boolean;
}

export const ExtendedSelector = <T,>({
  title,
  excluded,
  list,
  selected,
  setExcluded,
  setSelected,
  isDisabled,
  isLoading,
}: IExtendedSelectorProps<T & { id: number; name: string }>) => {
  const dispatch = useAppDispatch();

  return (
    <div className={styles.option}>
      <h3>{title}</h3>
      <div className={styles.option__selector}>
        <span>Include:</span>
        <Select
          isLoading={isLoading}
          isSearchable={true}
          isDisabled={isDisabled}
          className={styles.option__select}
          styles={multiSelectStyles}
          isMulti={true}
          options={list.map((item) => ({
            value: item,
            label: item.name,
          }))}
          defaultValue={selected.map((item) => ({
            value: item,
            label: item.name,
          }))}
          onChange={(values) =>
            dispatch(setSelected(values.map((value) => value.value)))
          }
        />
      </div>
      <div className={styles.option__selector}>
        <span>Exclude:</span>
        <Select
          isLoading={isLoading}
          isSearchable={true}
          isDisabled={isDisabled}
          className={styles.option__select}
          styles={multiSelectStyles}
          isMulti={true}
          defaultValue={excluded.map((item) => ({
            value: item,
            label: item.name,
          }))}
          options={list.map((item) => ({
            value: item,
            label: item.name,
          }))}
          onChange={(values) =>
            dispatch(setExcluded(values.map((value) => value.value)))
          }
        />
      </div>
    </div>
  );
};
