import { ITableCell, ITableRows } from "@/src/lib/shared/types/table.type";
import styles from "./MobileTable.module.scss";
import { useMemo, useState } from "react";
import { Button } from "@/src/lib/shared/ui/Button";
import { SvgChevron } from "@/src/lib/shared/ui/svg";
import classNames from "classnames";
import { Skeleton } from "@/src/lib/shared/ui/Skeleton";
import { useMinimumLoading } from "@/src/lib/shared/hooks/useMinimumLoading";
import { Dropdown } from "@/src/lib/shared/ui/Dropdown";
import { commonUtils } from "@/src/lib/shared/utils/common.utils";
import { Pagination } from "@/src/lib/shared/ui/Pagination";
import { compareTableCells } from "@/src/lib/shared/utils/table.utils";

const getRowKey = (header: ITableCell, index: number) =>
  header.id ??
  (["string", "number"].includes(typeof header.content)
    ? String(header.content)
    : String(index));

interface ITableProps<T> {
  rows?: ITableRows<T>;
  isLoading?: boolean;
  initialSortingKey?: keyof T;
  mobileHeadField: keyof T;
  limit?: number;
  isWithoutMobileSorting?: boolean;
  onRowClick?: (rowIndex: number) => void;
  getRowClassName?: (
    row: ITableRows<T>[number],
    index: number
  ) => string | undefined;
}

export const MobileTable = <T extends object>({
  rows,
  isLoading,
  initialSortingKey,
  mobileHeadField,
  isWithoutMobileSorting,
  limit,
  onRowClick,
  getRowClassName,
}: ITableProps<T>) => {
  const keys = useMemo(() => {
    const keys = !!rows?.length ? (Object.keys(rows[0]) as (keyof T)[]) : [];

    return keys;
  }, [rows]);

  const titles = useMemo(() => {
    const titles = !!rows?.length
      ? Object.keys(rows[0])?.map((key) => {
          const title = rows[0]?.[key as keyof T]?.title;

          return {
            key,
            label: typeof title === "string" ? title : commonUtils.upFL(key),
          };
        })
      : [];

    return titles;
  }, [rows]);

  const rowIndexes = useMemo(
    () => new Map(rows?.map((row, index) => [row, index])),
    [rows]
  );

  const [sortingKey, setSortingKey] = useState<keyof T | undefined>(
    initialSortingKey
  );
  const [sortingOrder, setSortingOrder] = useState<"asc" | "desc">("desc");

  const [page, setPage] = useState(1);
  const [activeKeys, setActiveKeys] = useState<string[]>([]);

  const take = limit || 50;

  const isLoaderShown = useMinimumLoading(!!isLoading);

  const sortedRows = useMemo(
    () =>
      !sortingKey
        ? rows
        : rows?.toSorted((a, b) =>
            compareTableCells(a[sortingKey], b[sortingKey], sortingOrder)
          ),
    [rows, sortingKey, sortingOrder]
  );

  const pageCount = Math.max(1, Math.ceil((sortedRows?.length ?? 0) / take));
  const currentPage = Math.min(page, pageCount);

  return (
    <div className={styles.table}>
      {isLoaderShown ? (
        <div role="status" aria-label="Loading">
          <Skeleton
            count={4}
            height="var(--padding-x25)"
            radius="var(--radius-x2)"
            gap="var(--gap-x1)"
          />
        </div>
      ) : (
        <>
          {!isWithoutMobileSorting && (
            <div className={styles.table__sorting}>
              <Dropdown
                isThroughPortal
                title="Sort by"
                list={titles.map((title) => title.label)}
                overwriteValue={
                  titles.find((title) => title.key === sortingKey)?.label
                }
                getIndex={(index) =>
                  setSortingKey(titles[index]?.key as keyof T)
                }
              />
              <Dropdown
                isThroughPortal
                title="Sort order"
                list={["Asc", "Desc"]}
                overwriteValue={sortingOrder === "asc" ? "Asc" : "Desc"}
                getIndex={(index) =>
                  setSortingOrder(index === 0 ? "asc" : "desc")
                }
              />
            </div>
          )}
          {!sortedRows?.length ? (
            <p className={styles.table__empty}>List is empty</p>
          ) : (
            sortedRows
              .slice((currentPage - 1) * take, currentPage * take)
              .map((row, i) => {
                const header = row[mobileHeadField];

                if (!header) return null;

                const rowKey = getRowKey(header, i);
                const isActive = activeKeys.includes(rowKey);
                const rowIndex = rowIndexes.get(row);

                return (
                  <div
                    key={i}
                    className={classNames(
                      styles.table__row,
                      rowIndex !== undefined && getRowClassName?.(row, rowIndex)
                    )}
                  >
                    <div className={styles.table__header}>
                      <div
                        className={classNames(
                          styles.table__title,
                          !!onRowClick && styles.table__title_clickable,
                          header.className
                        )}
                        onClick={() => {
                          header.onClick?.();

                          if (rowIndex !== undefined) onRowClick?.(rowIndex);
                        }}
                      >
                        {["string", "number"].includes(
                          typeof header.content
                        ) ? (
                          <p>{header.content}</p>
                        ) : (
                          header.content
                        )}
                      </div>
                      <Button
                        isOnlyIcon
                        onClick={() =>
                          setActiveKeys(
                            isActive
                              ? activeKeys.filter((key) => key !== rowKey)
                              : [rowKey, ...activeKeys]
                          )
                        }
                      >
                        <SvgChevron
                          style={{
                            transform: isActive ? "rotate(180deg)" : "none",
                          }}
                        />
                      </Button>
                    </div>
                    {isActive && (
                      <div className={classNames(styles.table__content)}>
                        {keys.map((key, j) => {
                          const rowField = !!row ? row[key] : undefined;

                          if (!rowField || key === mobileHeadField) return null;

                          return (
                            <div
                              key={j + (rowField.id || "")}
                              id={rowField.id}
                              className={styles.table__item}
                            >
                              {rowField.title &&
                                (["string", "number"].includes(
                                  typeof rowField.title
                                ) ? (
                                  <p className={styles.table__label}>
                                    {rowField.title}
                                  </p>
                                ) : (
                                  rowField.title
                                ))}
                              {["string", "number"].includes(
                                typeof rowField.content
                              ) ? (
                                <p>{rowField.content}</p>
                              ) : (
                                rowField.content
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
          )}
          {pageCount > 1 && (
            <Pagination
              total={sortedRows?.length ?? 0}
              take={take}
              page={currentPage}
              onPageChange={setPage}
              isWithoutSummary
            />
          )}
        </>
      )}
    </div>
  );
};
