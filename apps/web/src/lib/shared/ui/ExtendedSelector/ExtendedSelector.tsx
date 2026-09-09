import styles from "./ExtendedSelector.module.scss";
import { Dropdown } from "../Dropdown";

export interface IExtendedSelectorProps<
  T extends { _id: number; name: string },
> {
  title: string;
  list: T[];
  excluded: T[];
  selected: T[];
  setExcluded: any;
  setSelected: any;
  isDisabled?: boolean;
  icons?: string[];
}

export const ExtendedSelector = <T,>({
  title,
  excluded,
  list,
  selected,
  setExcluded,
  setSelected,
  isDisabled,
  icons,
}: IExtendedSelectorProps<T & { _id: number; name: string }>) => {
  return (
    <div className={styles.option}>
      <h4>{title}</h4>
      <div className={styles.option__selector}>
        <Dropdown
          icons={icons}
          isWithReset
          overflowRootId="consoles"
          isDisabled={isDisabled}
          list={list.map((item) => item.name)}
          borderTheme="green"
          isMulti
          overwriteValue={selected.map((item) => item?.name)?.join(", ") || ""}
          initialMultiValue={
            selected.map((item) =>
              list.findIndex((el) => el._id === item?._id)
            ) || []
          }
          placeholder="Include..."
          getIndexes={(indexes) =>
            setSelected(
              !!indexes?.length ? indexes.map((index) => list[index]) : []
            )
          }
        />
      </div>
      <div className={styles.option__selector}>
        <Dropdown
          icons={icons}
          isWithReset
          overflowRootId="consoles"
          isDisabled={isDisabled}
          list={list.map((item) => item.name)}
          borderTheme="red"
          isMulti
          overwriteValue={excluded.map((item) => item?.name)?.join(", ") || ""}
          initialMultiValue={
            excluded.map((item) =>
              list.findIndex((el) => el._id === item?._id)
            ) || []
          }
          placeholder="Exclude..."
          getIndexes={(indexes) =>
            setExcluded(indexes.map((index) => list[index]))
          }
        />
      </div>
    </div>
  );
};
