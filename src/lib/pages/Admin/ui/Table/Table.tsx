import styles from "./Table.module.scss";
import classNames from "classnames";
import { CSSProperties, useEffect, useMemo, useRef, useState } from "react";
import { SvgArrow } from "@/src/lib/shared/ui/svg";
import { Loader } from "@/src/lib/shared/ui/Loader";
import { ITableHeaders, ITableRows } from "@/src/lib/shared/types/table.type";
import { PaginationClient } from "../PaginationClient";

interface ITableProps<T> {
  id?: string;
  headers: ITableHeaders<T>;
  rows?: ITableRows<T>;
  columnStyles?: Partial<Record<keyof T, CSSProperties>>;
  initialSortingKey?: keyof T;
  initialSortingOrder?: "asc" | "desc";
  isLoading?: boolean;
  limit?: number;
  sortingCallback?: (key: keyof T, order: "asc" | "desc") => void;
}

export const Table = <T extends object>({
  id,
  rows,
  headers,
  columnStyles,
  initialSortingKey,
  initialSortingOrder,
  isLoading,
  limit,
  sortingCallback,
}: ITableProps<T>) => {
  const [sortingKey, setSortingKey] = useState<keyof T | undefined>(
    initialSortingKey
  );
  const [sortingOrder, setSortingOrder] = useState<"asc" | "desc">(
    initialSortingOrder || "desc"
  );
  const [sortedRows, setSortedRows] = useState<ITableRows<T>>();
  const [page, setPage] = useState(1);
  const [hoveredRowIndex, setHoveredRowIndex] = useState<number>();
  const [rowsWidth, setRowsWidth] = useState<{ [key: number]: number }>({});
  const dragIndex = useRef<number>(undefined);

  const take = useRef(limit || 50);

  const keys = useMemo(() => {
    const keys = Object.keys(headers) as (keyof T)[];
    return keys;
  }, [headers]);

  const isInactive = useMemo(
    () => isLoading || sortedRows === undefined,
    [sortedRows, isLoading]
  );

  useEffect(() => {
    if (!sortingKey || !!sortingCallback)
      return setSortedRows(rows || undefined);

    setSortedRows(
      rows?.toSorted((a, b) => {
        const first = a[sortingKey];
        const second = b[sortingKey];
        const firstValue = first.sortingValue || first.content || 1;
        const secondValue = second.sortingValue || second.content || 0;

        return firstValue > secondValue
          ? sortingOrder === "asc"
            ? 1
            : -1
          : sortingOrder === "asc"
            ? -1
            : 1;
      }) || undefined
    );
  }, [rows, sortingKey, sortingOrder, sortingCallback]);

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

  return (
    <div key={Object.keys(headers).join("_")} className={styles.wrapper}>
      {isInactive ? (
        <Loader />
      ) : (
        <div className={classNames(styles.table)}>
          {!rows?.length ? (
            <p className={styles.table__empty}>
              {isLoading ? "" : "List is empty"}
            </p>
          ) : (
            keys
              .filter((key) => !headers[key].isHidden)
              .map((key, i) => (
                <div
                  key={i}
                  id={`${id || "0"}-${Object.keys(headers).join("")}-${String(i)}`}
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
                  {[
                    headers,
                    ...(sortedRows?.slice(0, page * take.current) || []),
                  ].map((row, j) => {
                    const cell = row[key];

                    if (!cell || cell.isHidden) return null;

                    return (
                      <div
                        key={j}
                        id={cell.id}
                        className={classNames(
                          j !== 0 &&
                            hoveredRowIndex === j &&
                            styles.table__cell_hover,
                          j === 0 ? styles.table__header : styles.table__cell,
                          j === 0 &&
                            sortingKey === key &&
                            styles.table__header_active,
                          dragIndex.current !== undefined &&
                            styles.table__header_drag,
                          cell.className
                        )}
                        style={{
                          ...cell.style,
                        }}
                        onMouseEnter={() =>
                          dragIndex.current === undefined &&
                          setHoveredRowIndex(j)
                        }
                        onMouseLeave={() => setHoveredRowIndex(undefined)}
                      >
                        <div
                          className={classNames(styles.table__text, {
                            [styles.table__text_clickable]:
                              !!cell.onClick || j === 0,
                          })}
                          onClick={() => {
                            if (j === 0) {
                              if (sortingKey !== key) {
                                setSortingKey(key);
                                setSortingOrder("desc");
                                sortingCallback?.(key, "desc");
                              } else {
                                setSortingOrder(
                                  sortingOrder === "asc" ? "desc" : "asc"
                                );
                                sortingCallback?.(
                                  sortingKey,
                                  sortingOrder === "asc" ? "desc" : "asc"
                                );
                              }
                            }

                            !!cell.onClick && cell.onClick();
                          }}
                        >
                          {["string", "number"].includes(
                            typeof cell.content
                          ) ? (
                            <p>{cell.content}</p>
                          ) : (
                            cell.content
                          )}
                        </div>
                        {j === 0 && (
                          <div
                            className={classNames(
                              styles.table__arrow,
                              sortingKey === key && styles.table__arrow_active
                            )}
                          >
                            <SvgArrow
                              style={{
                                transform:
                                  sortingOrder === "desc"
                                    ? "rotate(90deg)"
                                    : "rotate(-90deg)",
                              }}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))
          )}
        </div>
      )}
      <PaginationClient
        page={page}
        setPage={setPage}
        take={take.current}
        length={sortedRows?.length}
      />
    </div>
  );
};
