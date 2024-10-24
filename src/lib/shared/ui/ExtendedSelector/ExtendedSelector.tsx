import styles from "./ExtendedSelector.module.scss";
import { Dropdown } from "../Dropdown";

export interface IExtendedSelectorProps<
  T extends { id: number; name: string }
> {
  title: string;
  list: T[];
  excluded: T[];
  selected: T[];
  setExcluded: any;
  setSelected: any;
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
  return (
    <div className={styles.option}>
      <h3>{title}</h3>
      <div className={styles.option__selector}>
        <Dropdown
          overflowRootId="consoles"
          isDisabled={isDisabled}
          list={list.map((item) => item.name)}
          borderTheme="green"
          isMulti
          overwriteValue={selected.map((item) => item?.name)?.join(", ") || ""}
          initialMultiValue={
            selected.map((item) =>
              list.findIndex((el) => el.id === item?.id)
            ) || []
          }
          placeholder="Include..."
          getIndexes={(indexes) =>
            setSelected(indexes.map((index) => list[index]))
          }
        />
      </div>
      <div className={styles.option__selector}>
        <Dropdown
          overflowRootId="consoles"
          isDisabled={isDisabled}
          list={list.map((item) => item.name)}
          borderTheme="red"
          isMulti
          overwriteValue={excluded.map((item) => item?.name)?.join(", ") || ""}
          initialMultiValue={
            excluded.map((item) =>
              list.findIndex((el) => el.id === item?.id)
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
