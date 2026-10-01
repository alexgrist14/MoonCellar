import { FC } from "react";
import { ICustomListGamesSort, ICustomListsOrder } from "@mooncellar/schemas";
import {
  ISortControlOption,
  SortControl,
} from "@/src/lib/shared/ui/SortControl";

export const LIST_GAMES_SORT_OPTIONS: ISortControlOption<ICustomListGamesSort>[] =
  [
    { value: "position", label: "List order" },
    { value: "addedAt", label: "Date added" },
    { value: "name", label: "Name" },
    { value: "release", label: "Release date" },
    { value: "rating", label: "Rating" },
  ];

interface IListGamesSortProps {
  sortBy: ICustomListGamesSort;
  sortOrder: ICustomListsOrder;
  onChange: (
    sortBy: ICustomListGamesSort,
    sortOrder: ICustomListsOrder
  ) => void;
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
  <SortControl
    className={className}
    options={LIST_GAMES_SORT_OPTIONS}
    sortBy={sortBy}
    sortOrder={sortOrder}
    isDisabled={isDisabled}
    onChange={(by, order) => onChange(by ?? sortBy, order)}
  />
);
