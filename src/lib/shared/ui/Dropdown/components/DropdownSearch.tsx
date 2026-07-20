import { ChangeEvent, FC, RefObject } from "react";
import classNames from "classnames";
import styles from "../Dropdown.module.scss";

interface IDropdownSearchProps {
  isActive: boolean;
  query: string;
  searchRef: RefObject<HTMLInputElement | null>;
  onChange: (value: string) => void;
}

export const DropdownSearch: FC<IDropdownSearchProps> = ({
  isActive,
  query,
  searchRef,
  onChange,
}) => {
  return (
    <div
      className={classNames(styles.dropdown__search, {
        [styles.dropdown__search_active]: isActive,
      })}
    >
      <input
        ref={searchRef}
        value={query}
        onChange={(e: ChangeEvent<HTMLInputElement>) =>
          onChange(e.target.value)
        }
        placeholder="Search..."
      />
    </div>
  );
};
