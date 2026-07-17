import { ITableRows } from '@/src/lib/shared/types/table.type';
import styles from './MobileTable.module.scss';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/src/lib/shared/ui/Button';
import { SvgChevron } from '@/src/lib/shared/ui/svg';
import classNames from 'classnames';
import { Loader } from '@/src/lib/shared/ui/Loader';
import { Dropdown } from '@/src/lib/shared/ui/Dropdown';
import { commonUtils } from '@/src/lib/shared/utils/common.utils';
import { PaginationClient } from '@/src/lib/shared/ui/PaginationClient';

interface ITableProps<T> {
  rows?: ITableRows<T>;
  isLoading?: boolean;
  initialSortingKey?: keyof T;
  mobileHeadField: keyof T;
  limit?: number;
  isWithoutMobileSorting?: boolean;
}

export const MobileTable = <T extends object>({
  rows,
  isLoading,
  initialSortingKey,
  mobileHeadField,
  isWithoutMobileSorting,
  limit,
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
            label:
              typeof title === 'string' ? title : commonUtils.upFL(key),
          };
        })
      : [];

    return titles;
  }, [rows]);

  const [sortingKey, setSortingKey] = useState<keyof T | undefined>(
    initialSortingKey,
  );
  const [sortingOrder, setSortingOrder] = useState<'asc' | 'desc'>('desc');
  const [sortedRows, setSortedRows] = useState<ITableRows<T>>();

  const [page, setPage] = useState(1);
  const [activeIndexes, setActiveIndexes] = useState<number[]>([]);

  const take = useRef(limit || 20);

  const isInactive = useMemo(
    () => isLoading || sortedRows === undefined,
    [sortedRows, isLoading],
  );

  useEffect(() => {
    if (!!sortingKey) {
      setSortedRows(
        rows?.toSorted((a, b) => {
          const first = a[sortingKey];
          const second = b[sortingKey];
          const firstValue = first.sortingValue || first.content || 1;
          const secondValue = second.sortingValue || second.content || 0;

          return firstValue > secondValue
            ? sortingOrder === 'asc'
              ? 1
              : -1
            : sortingOrder === 'asc'
              ? -1
              : 1;
        }),
      );
    } else {
      setSortedRows(rows);
    }
  }, [rows, sortingKey, sortingOrder]);

  return (
    <div className={styles.table}>
      {isInactive ? (
        <Loader />
      ) : (
        <>
          {!isWithoutMobileSorting && (
            <div className={styles.table__sorting}>
              <Dropdown
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
                title="Sort order"
                list={['Asc', 'Desc']}
                overwriteValue={sortingOrder === 'asc' ? 'Asc' : 'Desc'}
                getIndex={(index) =>
                  setSortingOrder(index === 0 ? 'asc' : 'desc')
                }
              />
            </div>
          )}
          {!sortedRows?.length ? (
            <p className={styles.table__empty}>List is empty</p>
          ) : (
            sortedRows.slice(0, page * take.current).map((row, i) => {
              const isActive = activeIndexes.includes(i);
              const header = row[mobileHeadField];

              if (!header) return null;

              return (
                <div key={i} className={styles.table__row}>
                  <div className={styles.table__header}>
                    {['string', 'number'].includes(typeof header.content) ? (
                      <p>{header.content}</p>
                    ) : (
                      header.content
                    )}
                    <Button
                      compact
                      onClick={() =>
                        setActiveIndexes(
                          isActive
                            ? activeIndexes.filter((index) => index !== i)
                            : [i, ...activeIndexes],
                        )
                      }
                    >
                      <SvgChevron
                        style={{
                          transform: isActive ? 'rotate(180deg)' : 'none',
                        }}
                      />
                    </Button>
                  </div>
                  {isActive && (
                    <div className={classNames(styles.table__content)}>
                      {keys.map((key, j) => {
                        const rowField = !!row ? row[key] : undefined;

                        if (!rowField) return null;

                        return (
                          <div
                            key={j + (rowField.id || '')}
                            id={rowField.id}
                            className={styles.table__item}
                          >
                            {rowField.title &&
                              (['string', 'number'].includes(
                                typeof rowField.title,
                              ) ? (
                                <p style={{ whiteSpace: 'nowrap' }}>
                                  {rowField.title}:
                                </p>
                              ) : (
                                rowField.title
                              ))}
                            {['string', 'number'].includes(
                              typeof rowField.content,
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
          <PaginationClient
            page={page}
            setPage={setPage}
            take={take.current}
            length={sortedRows?.length}
          />
        </>
      )}
    </div>
  );
};
