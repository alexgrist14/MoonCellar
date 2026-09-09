import { FC } from "react";
import { AutoSizer, List, ListRowRenderer } from "react-virtualized";
import { DropdownItem, IDropdownItemProps } from "./DropdownItem";
import { IIndexedItem } from "../Dropdown.types";

interface IDropdownVirtualListProps {
  indexedList: IIndexedItem[];
  rowHeight: number;
  height: number;
  scrollTop: number;
  getItemProps: (item: IIndexedItem) => Omit<IDropdownItemProps, "style">;
}

export const DropdownVirtualList: FC<IDropdownVirtualListProps> = ({
  indexedList,
  rowHeight,
  height,
  scrollTop,
  getItemProps,
}) => {
  const rowRenderer: ListRowRenderer = ({ index, key, style }) => {
    const item = indexedList[index];

    return <DropdownItem key={key} style={style} {...getItemProps(item)} />;
  };

  return (
    <AutoSizer disableHeight>
      {({ width }) => (
        <List
          autoHeight
          width={width}
          height={height}
          scrollTop={scrollTop}
          rowCount={indexedList.length}
          rowHeight={rowHeight}
          overscanRowCount={8}
          rowRenderer={rowRenderer}
        />
      )}
    </AutoSizer>
  );
};
