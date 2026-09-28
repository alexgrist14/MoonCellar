import { FC } from "react";
import classNames from "classnames";
import {
  ICustomListGamesSort,
  ICustomListsOrder,
} from "@mooncellar/schemas";
import { Dropdown } from "@/src/lib/shared/ui/Dropdown";
import { SvgChevron } from "@/src/lib/shared/ui/svg";
import { ToggleSwitch } from "@/src/lib/shared/ui/ToggleSwitch";
import styles from "./ListGamesSort.module.scss";

export const LIST_GAMES_SORT_OPTIONS: {
  value: ICustomListGamesSort;
  label: string;
}[] = [
  { value: "position", label: "List order" },
  { value: "addedAt", label: "Date added" },
  { value: "name", label: "Name" },
  { value: "release", label: "Release date" },
  { value: "rating", label: "Rating" },
];

interface IListGamesSortProps {
  sortBy: ICustomListGamesSort;
  sortOrder: ICustomListsOrder;
  onChange: (sortBy: ICustomListGamesSort, sortOrder: ICustomListsOrder) => void;
  isDisabled?: boolean;
  className?: string;
}

export const ListGamesSort: FC<IListGamesSortProps> = ({
  sortBy,
  sortOrder,
  onChange,
  isDisabled,
  className,
}) => (
  <div className={classNames(styles.sort, className)}>
    <Dropdown
      isThroughPortal
      isDisabled={isDisabled}
      list={LIST_GAMES_SORT_OPTIONS.map((option) => option.label)}
      overwriteValue={
        LIST_GAMES_SORT_OPTIONS.find((option) => option.value === sortBy)
          ?.label
      }
      getIndex={(index) =>
        onChange(LIST_GAMES_SORT_OPTIONS[index]?.value ?? sortBy, sortOrder)
      }
    />
    <ToggleSwitch
      isColorless
      isDisabled={isDisabled}
      leftContent={<SvgChevron style={{ transform: "rotate(180deg)" }} />}
      rightContent={<SvgChevron />}
      value={sortOrder === "asc" ? "left" : "right"}
      clickCallback={() =>
        onChange(sortBy, sortOrder === "asc" ? "desc" : "asc")
      }
    />
  </div>
);
