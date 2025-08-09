import { ITableRows } from "@lib/shared/types/table.type";
import styles from "./MobileTable.module.scss";
import { useEffect, useMemo, useRef, useState } from "react";
import { Typography } from "@ui/Typography";
import { Button } from "@ui/Button";
import { IconChevron } from "@ui/icons/IconChevron";
import classNames from "classnames";
import { Loader } from "@ui/Loader";
import { Selector } from "@ui/Selector";
import { upFL } from "@utils/transform";
import { ContentTitle } from "@ui/ContentTitle";
import { PaginationClient } from "@ui/PaginationClient";

interface ITableProps<T> {
  rows?: ITableRows<T>;
  isLoading?: boolean;
  initialSortingKey?: keyof T;
  mobileHeadField: keyof T;
  limit?: number;
}

export const MobileTable = <T extends object>({
  rows,
  isLoading,
  initialSortingKey,
  mobileHeadField,
  limit,
}: ITableProps<T>) => {
  const keys = useMemo(() => {
    const keys = !!rows?.length ? (Object.keys(rows[0]) as (keyof T)[]) : [];

    return keys;
  }, [rows]);

  const titles = useMemo(() => {
    const titles = !!rows?.length
      ? Object.keys(rows[0])?.map((key) => ({
          title: rows[0]?.[key as keyof T]?.title,
          key,
        }))
      : [];

    return titles;
  }, [rows]);

  const [sortingKey, setSortingKey] = useState<keyof T | undefined>(
    initialSortingKey
  );
  const [sortingOrder, setSortingOrder] = useState<"asc" | "desc">("desc");
  const [sortedRows, setSortedRows] = useState<ITableRows<T>>();

  const [page, setPage] = useState(1);
  const [activeIndexes, setActiveIndexes] = useState<number[]>([]);

  const take = useRef(limit || 20);

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
    <div className={styles.table}>
      <div className={styles.table__sorting}>
        <ContentTitle title="Sort by">
          <Selector
            closeOnSelect
            onSelect={(value) => setSortingKey(value.id as keyof T)}
            selectedIds={!!sortingKey ? [sortingKey.toString()] : []}
            list={titles.map((title) => ({
              id: title.key,
              content: title.title || upFL(title.key),
            }))}
          />
        </ContentTitle>
        <ContentTitle title="Sort order">
          <Selector
            closeOnSelect
            onSelect={(value) => setSortingOrder(value.id as "asc" | "desc")}
            selectedIds={[sortingOrder]}
            list={[
              { id: "asc", content: "Asc" },
              { id: "desc", content: "Desc" },
            ]}
          />
        </ContentTitle>
      </div>
      {isLoading || sortedRows === undefined ? (
        <Loader isAbsoluteFill />
      ) : !sortedRows.length ? (
        <Typography
          tag="p"
          style="body"
          size="large"
          color="primary"
          className={styles.table__empty}
        >
          List is empty
        </Typography>
      ) : (
        sortedRows.slice(0, page * take.current).map((row, i) => {
          const isActive = activeIndexes.includes(i);
          const header = row[mobileHeadField];

          if (!header) return null;

          return (
            <div key={i} className={styles.table__row}>
              <div className={styles.table__header}>
                {["string", "number"].includes(typeof header.content) ? (
                  <Typography tag="p" style="body" size="small" color="primary">
                    {header.content}
                  </Typography>
                ) : (
                  header.content
                )}
                <Button
                  onlyIcon
                  size="small"
                  onClick={() =>
                    setActiveIndexes(
                      isActive
                        ? activeIndexes.filter((index) => index !== i)
                        : [i, ...activeIndexes]
                    )
                  }
                >
                  <IconChevron
                    direction={isActive ? "top" : "bottom"}
                    size="24"
                    color="accent"
                  />
                </Button>
              </div>
              {isActive && (
                <div className={classNames(styles.table__content)}>
                  {keys.map((key, j) => {
                    const rowField = !!row ? row[key] : undefined;

                    if (!rowField) return null;

                    return (
                      <div key={j} className={styles.table__item}>
                        {rowField.title &&
                          (["string", "number"].includes(
                            typeof rowField.title
                          ) ? (
                            <Typography
                              tag="p"
                              style="body"
                              size="small"
                              color="primary"
                              cssStyle={{ whiteSpace: "nowrap" }}
                            >
                              {rowField.title}:
                            </Typography>
                          ) : (
                            rowField.title
                          ))}
                        {["string", "number"].includes(
                          typeof rowField.content
                        ) ? (
                          <Typography
                            tag="p"
                            style="body"
                            size="small"
                            color="primary"
                          >
                            {rowField.content}
                          </Typography>
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
      <PaginationClient
        page={page}
        setPage={setPage}
        take={take.current}
        length={sortedRows?.length}
      />
    </div>
  );
};
