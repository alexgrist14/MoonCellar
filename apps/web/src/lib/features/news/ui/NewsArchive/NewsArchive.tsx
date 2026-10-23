import { FC, MouseEvent, useState } from "react";
import Link from "next/link";
import { IArticleArchive, IGetArticlesQuery } from "@mooncellar/schemas";
import { formatArchiveMonth } from "@/src/lib/entities/article/model";
import { SvgChevron } from "@/src/lib/shared/ui/svg";
import {
  getNewsHref,
  pushNewsQuery,
} from "@/src/lib/features/news/model/news-query.utils";
import styles from "./NewsArchive.module.scss";

interface INewsArchiveProps {
  archive: IArticleArchive;
  params: IGetArticlesQuery;
}

interface IArchiveLinkProps {
  target: IGetArticlesQuery;
  label: string;
  count: number;
  isCurrent: boolean;
  isStrong?: boolean;
}

const ArchiveLink: FC<IArchiveLinkProps> = ({
  target,
  label,
  count,
  isCurrent,
  isStrong,
}) => (
  <Link
    href={getNewsHref(target)}
    prefetch={false}
    scroll={false}
    aria-current={isCurrent ? "true" : undefined}
    className={styles.archive__link}
    data-strong={isStrong || undefined}
    onClick={(event: MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault();
      pushNewsQuery(target);
    }}
  >
    {label}
    <span className={styles.archive__count}>{count}</span>
  </Link>
);

export const NewsArchive: FC<INewsArchiveProps> = ({ archive, params }) => {
  const [openYears, setOpenYears] = useState(
    () => new Set([params.year ?? archive.years[0]?.year])
  );
  const base: IGetArticlesQuery = {
    ...params,
    year: undefined,
    month: undefined,
    page: 1,
  };

  const toggleYear = (year: number) =>
    setOpenYears((current) => {
      const next = new Set(current);

      next.has(year) ? next.delete(year) : next.add(year);

      return next;
    });

  return (
    <ul className={styles.archive}>
      <li className={styles.archive__row}>
        <span className={styles.archive__spacer} />
        <ArchiveLink
          target={base}
          label="All posts"
          count={archive.total}
          isCurrent={!params.year}
          isStrong
        />
      </li>
      {archive.years.map((entry) => {
        const isOpen = openYears.has(entry.year);

        return (
          <li key={entry.year}>
            <div className={styles.archive__row}>
              <button
                type="button"
                className={styles.archive__toggle}
                aria-expanded={isOpen}
                aria-label={`${isOpen ? "Hide" : "Show"} the months of ${entry.year}`}
                onClick={() => toggleYear(entry.year)}
              >
                <SvgChevron
                  size="12"
                  style={{
                    color: "inherit",
                    transform: isOpen ? undefined : "rotate(-90deg)",
                  }}
                />
              </button>
              <ArchiveLink
                target={{ ...base, year: entry.year }}
                label={String(entry.year)}
                count={entry.count}
                isCurrent={params.year === entry.year && !params.month}
                isStrong
              />
            </div>
            <ul className={styles.archive__months} hidden={!isOpen}>
              {entry.months.map(({ month, count }) => (
                <li key={month}>
                  <ArchiveLink
                    target={{ ...base, year: entry.year, month }}
                    label={formatArchiveMonth(month)}
                    count={count}
                    isCurrent={
                      params.year === entry.year && params.month === month
                    }
                  />
                </li>
              ))}
            </ul>
          </li>
        );
      })}
    </ul>
  );
};
