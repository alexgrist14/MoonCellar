import styles from "./Table.module.scss";
import classNames from "classnames";
import { CSSProperties, useEffect, useMemo, useRef, useState } from "react";
import { SvgArrow } from "@/src/lib/shared/ui/svg";
import { Loader } from "@/src/lib/shared/ui/Loader";
import { ITableHeaders, ITableRows } from "@/src/lib/shared/types/table.type";
import { PaginationClient } from "../PaginationClient";

interface ITableProps<T> {
  headers: ITableHeaders<T>;
  rows?: ITableRows<T>;
  columnStyles?: Partial<Record<keyof T, CSSProperties>>;
  initialSortingKey?: keyof T;
  initialSortingOrder?: "asc" | "desc";
  isLoading?: boolean;
  mobileHeadField?: keyof T;
  limit?: number;
}

export const Table = <T extends object>({
  rows,
  headers,
  columnStyles,
  initialSortingKey,
  initialSortingOrder,
  isLoading = false,
  limit,
}: ITableProps<T>) => {
  const [sortingKey, setSortingKey] = useState<keyof T | undefined>(
    initialSortingKey
  );
  const [sortingOrder, setSortingOrder] = useState<"asc" | "desc">(
    initialSortingOrder || "desc"
  );
  const [sortedRows, setSortedRows] = useState<ITableRows<T>>();
  const [page, setPage] = useState(1);

  const take = useRef(limit || 50);

  const keys = useMemo(() => {
    const keys = Object.keys(headers) as (keyof T)[];

    return keys;
  }, [headers]);

  useEffect(() => {
    if (!!sortingKey) {
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
        })
      );
    } else {
      setSortedRows(rows);
    }
  }, [rows, sortingKey, sortingOrder]);

  return (
    <div className={styles.wrapper}>
      <div className={styles.table}>
        {isLoading || sortedRows === undefined ? (
          <Loader />
        ) : !sortedRows.length ? (
          <p className={styles.table__empty}>List is empty</p>
        ) : (
          keys
            .filter((key) => !headers[key].isHidden)
            .map((key, i) => (
              <div
                key={i}
                className={styles.table__column}
                style={columnStyles?.[key]}
              >
                {[headers, ...sortedRows.slice(0, page * take.current)].map(
                  (row, j) => {
                    const cell = row[key];

                    if (!cell || cell.isHidden) return null;

                    return (
                      <div
                        key={j}
                        id={cell.id}
                        className={classNames(
                          j === 0 ? styles.table__header : styles.table__cell,
                          j === 0 &&
                            sortingKey === key &&
                            styles.table__header_active,
                          cell.className
                        )}
                        style={cell.style}
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
                              } else {
                                setSortingOrder(
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
                          {j === 0 && sortingKey === key && (
                            <SvgArrow
                            // direction={
                            //   sortingOrder === 'desc' ? 'bottom' : 'top'
                            // }
                            // size="16"
                            />
                          )}
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            ))
        )}
      </div>
      <PaginationClient
        page={page}
        setPage={setPage}
        take={take.current}
        length={sortedRows?.length}
      />
    </div>
  );
};
