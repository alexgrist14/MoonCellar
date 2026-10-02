import { SvgArrow, SvgResize } from "@/src/lib/shared/ui/svg";
import styles from "./Table.module.scss";
import { ITableHeaders, ITableRows } from "@/src/lib/shared/types/table.type";
import classNames from "classnames";
import { CSSProperties, useEffect, useMemo, useRef, useState } from "react";
import { Loader } from "@/src/lib/shared/ui/Loader";
import { useMinimumLoading } from "@/src/lib/shared/hooks/useMinimumLoading";
import { useStatesStore } from "@/src/lib/shared/store/states.store";
import { MobileTable } from "@/src/lib/shared/ui/MobileTable";
import { Pagination } from "@/src/lib/shared/ui/Pagination";
import { compareTableCells } from "@/src/lib/shared/utils/table.utils";

interface ITableProps<T> {
  id?: string;
  headers: ITableHeaders<T>;
  rows?: ITableRows<T>;
  columnStyles?: Partial<Record<NoInfer<keyof T>, CSSProperties>>;
  initialSortingKey?: keyof T;
  initialSortingOrder?: "asc" | "desc";
  isLoading?: boolean;
  mobileHeadField?: keyof T;
  isWithoutMobileSorting?: boolean;
  limit?: number;
  sortingCallback?: (key: keyof T, order: "asc" | "desc") => void;
  onRowClick?: (rowIndex: number) => void;
  rowClickExcludeKeys?: (keyof T)[];
  isWithoutSorting?: boolean;
  getRowClassName?: (
    row: ITableRows<T>[number],
    index: number
  ) => string | undefined;
  layout?: "columns" | "rows";
}

export const Table = <T extends object>({
  id,
  rows,
  headers,
  columnStyles,
  initialSortingKey,
  initialSortingOrder,
  isLoading,
  mobileHeadField,
  isWithoutMobileSorting,
  limit,
  sortingCallback,
  onRowClick,
  rowClickExcludeKeys,
  isWithoutSorting,
  getRowClassName,
  layout = "columns",
}: ITableProps<T>) => {
  const { isMobile } = useStatesStore();

  const [sortingKey, setSortingKey] = useState<keyof T | undefined>(
    initialSortingKey
  );
  const [sortingOrder, setSortingOrder] = useState<"asc" | "desc">(
    initialSortingOrder || "desc"
  );
  const [page, setPage] = useState(1);
  const [hoveredRowIndex, setHoveredRowIndex] = useState<number>();
  const [rowsWidth, setRowsWidth] = useState<{ [key: number]: number }>({});
  const dragIndex = useRef<number>(undefined);

  const take = limit || 50;

  const keys = useMemo(() => {
    const keys = Object.keys(headers) as (keyof T)[];

    return keys;
  }, [headers]);

  const isLoaderShown = useMinimumLoading(!!isLoading);

  const sortedRows = useMemo(
    () =>
      !sortingKey || !!sortingCallback || isWithoutSorting
        ? rows
        : rows?.toSorted((a, b) =>
            compareTableCells(a[sortingKey], b[sortingKey], sortingOrder)
          ),
    [rows, sortingKey, sortingOrder, sortingCallback, isWithoutSorting]
  );

  const rowIndexes = useMemo(
    () => new Map(rows?.map((row, index) => [row, index])),
    [rows]
  );

  const mobileRows = useMemo(
    () =>
      rows?.map((row) =>
        keys.reduce(
          (res, key) => {
            if (res[key])
              res[key] = { ...res[key], title: headers[key].content };

            return res;
          },
          { ...row }
        )
      ),
    [rows, keys, headers]
  );

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const index = dragIndex.current;
      if (index === undefined) return;

      e.preventDefault();
      const column = document.getElementById(
        `${id || "0"}-${Object.keys(headers).join("")}-${String(index)}`
      );

      if (!column) return;

      const columnRect = column.getBoundingClientRect();
      const width = e.clientX - columnRect.x;

      setRowsWidth((prev) => ({
        ...prev,
        [index]: width,
      }));
    };
    const resetIndex = () => {
      dragIndex.current = undefined;
    };

    document.addEventListener("mouseup", resetIndex);
    document.addEventListener("mousemove", handler);

    return () => {
      document.removeEventListener("mouseup", resetIndex);
      document.removeEventListener("mousemove", handler);
    };
  });

  if (isMobile && !!mobileHeadField) {
    return (
      <MobileTable
        isLoading={isLoading}
        isWithoutMobileSorting={
          isWithoutMobileSorting || isWithoutSorting || !!sortingCallback
        }
        limit={limit}
        initialSortingKey={isWithoutSorting ? undefined : initialSortingKey}
        getRowClassName={getRowClassName}
        mobileHeadField={mobileHeadField}
        rows={mobileRows}
        onRowClick={onRowClick}
      />
    );
  }

  const visibleKeys = keys.filter((key) => !headers[key].isHidden);
  const isRowLayout = layout === "rows";
  const getColumnId = (i: number) =>
    `${id || "0"}-${Object.keys(headers).join("")}-${String(i)}`;

  const renderCell = (
    row: ITableHeaders<T>,
    key: keyof T,
    i: number,
    j: number
  ) => {
    const cell = row[key];

    if (!cell || cell.isHidden)
      return isRowLayout ? <div key={j} role="cell" /> : null;

    const isHeader = j === 0;
    const rowIndex = isHeader ? undefined : rowIndexes.get(row);
    const isRowClickable =
      !!onRowClick &&
      rowIndex !== undefined &&
      !rowClickExcludeKeys?.includes(key);
    const isSortable = isHeader && !isWithoutSorting;

    return (
      <div
        key={j + (cell.id || "")}
        id={isRowLayout && isHeader ? getColumnId(i) : cell.id}
        role={isRowLayout ? (isHeader ? "columnheader" : "cell") : undefined}
        className={classNames(
          !isHeader && hoveredRowIndex === j && styles.table__cell_hover,
          isHeader ? styles.table__header : styles.table__cell,
          isHeader && cell.isNotResizable && styles.table__header_fixed,
          isSortable && sortingKey === key && styles.table__header_active,
          dragIndex.current !== undefined && styles.table__header_drag,
          rowIndex !== undefined && getRowClassName?.(row, rowIndex),
          cell.className,
          isRowClickable && styles.table__cell_clickable,
          !!cell.onClick || (isSortable && styles.table__header_clickable)
        )}
        style={{
          ...cell.style,
        }}
        onMouseEnter={() =>
          dragIndex.current === undefined && setHoveredRowIndex(j)
        }
        onMouseLeave={() => setHoveredRowIndex(undefined)}
        onClick={() => {
          if (isSortable) {
            if (sortingKey !== key) {
              setSortingKey(key);
              setSortingOrder("desc");
              sortingCallback?.(key, "desc");
            } else {
              setSortingOrder(sortingOrder === "asc" ? "desc" : "asc");
              sortingCallback?.(
                sortingKey,
                sortingOrder === "asc" ? "desc" : "asc"
              );
            }
          }

          !!cell.onClick && cell.onClick();

          if (isRowClickable && rowIndex !== undefined) onRowClick?.(rowIndex);
        }}
      >
        <div className={classNames(styles.table__text)}>
          {["string", "number"].includes(typeof cell.content) ? (
            <p>{cell.content}</p>
          ) : (
            cell.content
          )}
        </div>
        {isSortable && (
          <div
            className={classNames(
              styles.table__arrow,
              sortingKey === key && styles.table__arrow_active
            )}
          >
            <SvgArrow
              style={{
                transform:
                  sortingOrder === "desc" ? "rotate(90deg)" : "rotate(-90deg)",
              }}
            />
          </div>
        )}
        {!cell.isNotResizable && isHeader && (
          <div
            className={styles.table__resizer}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();

              dragIndex.current = i;
            }}
          >
            <SvgResize />
          </div>
        )}
      </div>
    );
  };

  const pageCount = Math.max(1, Math.ceil((sortedRows?.length ?? 0) / take));
  const currentPage = Math.min(page, pageCount);
  const shownRows = [
    headers,
    ...(sortedRows?.slice((currentPage - 1) * take, currentPage * take) || []),
  ];

  return (
    <div key={Object.keys(headers).join("_")} className={styles.wrapper}>
      {isLoaderShown ? (
        <Loader />
      ) : !sortedRows?.length ? (
        <div className={styles.table}>
          <p className={styles.table__empty}>List is empty</p>
        </div>
      ) : isRowLayout ? (
        <div
          role="table"
          className={classNames(styles.table, styles.table_rows)}
          style={{
            gridTemplateColumns: visibleKeys
              .map((key, i) =>
                rowsWidth[i]
                  ? `${Math.max(rowsWidth[i], 80)}px`
                  : `minmax(${columnStyles?.[key]?.minWidth ?? "80px"}, ${columnStyles?.[key]?.width ?? "1fr"})`
              )
              .join(" "),
          }}
        >
          {shownRows.map((row, j) => (
            <div key={j} role="row" className={styles.table__row}>
              {visibleKeys.map((key, i) => renderCell(row, key, i, j))}
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.table}>
          {visibleKeys.map((key, i) => (
            <div
              key={i}
              id={getColumnId(i)}
              className={styles.table__column}
              style={{
                ...columnStyles?.[key],
                flexGrow: !rowsWidth[i] ? 1 : 0,
                flexShrink: !rowsWidth[i] ? 1 : 0,
                flexBasis: !!rowsWidth[i]
                  ? Math.max(rowsWidth[i], 80) + "px"
                  : columnStyles?.[key]?.width || "auto",
              }}
            >
              {shownRows.map((row, j) => renderCell(row, key, i, j))}
            </div>
          ))}
        </div>
      )}
      {!isLoaderShown && pageCount > 1 && (
        <Pagination
          total={sortedRows?.length ?? 0}
          take={take}
          page={currentPage}
          onPageChange={setPage}
          isWithoutSummary
        />
      )}
    </div>
  );
};
