import styles from "./ExtendedSelector.module.scss";
import Select from "react-select";
import { useAppDispatch } from "../../store";
import { ActionCreatorWithPayload } from "@reduxjs/toolkit";
import classNames from "classnames";
import { selectStyles } from "../../constants";

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
        <Select
          isLoading={isLoading}
          isSearchable={true}
          className={classNames(styles.option__select, {
            [styles.option__select_disabled]: isDisabled,
          })}
          styles={selectStyles("include")}
          isMulti={true}
          options={list.map((item) => ({
            value: item,
            label: item.name,
          }))}
          defaultValue={selected.map((item) => ({
            value: item,
            label: item.name,
          }))}
          placeholder="Include..."
          onChange={(values) =>
            dispatch(setSelected(values.map((value) => value.value)))
          }
        />
      </div>
      <div className={styles.option__selector}>
        <Select
          isLoading={isLoading}
          isSearchable={true}
          className={classNames(styles.option__select, {
            [styles.option__select_disabled]: isDisabled,
          })}
          styles={selectStyles("exclude")}
          isMulti={true}
          defaultValue={excluded.map((item) => ({
            value: item,
            label: item.name,
          }))}
          options={list.map((item) => ({
            value: item,
            label: item.name,
          }))}
          placeholder="Exclude..."
          onChange={(values) =>
            dispatch(setExcluded(values.map((value) => value.value)))
          }
        />
      </div>
    </div>
  );
};
