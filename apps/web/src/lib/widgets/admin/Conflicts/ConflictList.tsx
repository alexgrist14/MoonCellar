import { FC, useState } from "react";
import Link from "next/link";
import classNames from "classnames";
import { useDebouncedCallback } from "use-debounce";
import { CONFLICTS_PAGE_SIZE, IConflictSource } from "@mooncellar/schemas";
import { Input } from "@/src/lib/shared/ui/Input";
import { ToggleSwitch } from "@/src/lib/shared/ui/ToggleSwitch";
import { Table } from "@/src/lib/shared/ui/Table";
import { ITableCell } from "@/src/lib/shared/types/table.type";
import { Pagination } from "@/src/lib/shared/ui/Pagination";
import { useConflictsQuery } from "@/src/lib/entities/conflict/api";
import { setAdminQuery } from "@/src/lib/shared/utils/admin-url.utils";
import {
  REASON_LABELS,
  SOURCE_LABELS,
  stateLabel,
  externalUrl,
} from "./labels";
import styles from "./Conflicts.module.scss";

const SEARCH_DELAY_MS = 300;
const ON = "ON";
const OFF = "OFF";

interface IConflictListProps {
  source?: IConflictSource;
}

export const ConflictList: FC<IConflictListProps> = ({ source }) => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [isWaitingOnly, setIsWaitingOnly] = useState(true);

  const { data, isLoading, isFetching } = useConflictsQuery({
    page,
    take: CONFLICTS_PAGE_SIZE,
    search: search || undefined,
    source,
    isWaitingOnly,
  });

  const debouncedSearch = useDebouncedCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, SEARCH_DELAY_MS);

  const rows = data?.results ?? [];

  return (
    <div className={styles.list}>
      <div className={styles.filters}>
        <div className={styles.search}>
          <Input
            value={inputValue}
            placeholder="Search an entry or a candidate name"
            onChange={(event) => {
              setInputValue(event.target.value);
              debouncedSearch(event.target.value);
            }}
          />
        </div>
        <div className={styles.toggle}>
          Hide decided
          <ToggleSwitch
            leftContent={OFF}
            rightContent={ON}
            value={isWaitingOnly ? "right" : "left"}
            clickCallback={(result) => {
              setIsWaitingOnly(result === ON);
              setPage(1);
            }}
          />
        </div>
      </div>

      <Table
        mobileHeadField="entry"
        isLoading={isLoading}
        limit={CONFLICTS_PAGE_SIZE}
        headers={{
          entry: { content: "Entry" },
          state: { content: "State" },
          reason: { content: "Why it waits" },
          result: { content: "Result" },
        }}
        rows={rows.map((row) => {
          const open = () =>
            setAdminQuery({ source: row.source, conflict: row.externalId });
          const cells = {
            entry: {
              content: (
                <div className={styles.rowVn}>
                  <span className={styles.rowName}>{row.externalName}</span>
                  {externalUrl(row.source, row.externalId) ? (
                    <a
                      className={styles.rowLink}
                      href={
                        externalUrl(row.source, row.externalId) ?? undefined
                      }
                      target="_blank"
                      rel="noreferrer"
                      onClick={(event) => event.stopPropagation()}
                    >
                      {SOURCE_LABELS[row.source]}{" "}
                      {row.direction === "games" ? row.externalId : "match"}
                    </a>
                  ) : (
                    <span className={styles.rowLink}>
                      {SOURCE_LABELS[row.source]}{" "}
                      {row.direction === "games" ? row.externalId : "match"}
                    </span>
                  )}
                </div>
              ),
            },
            state: {
              content: (
                <span
                  className={classNames(styles.badge, {
                    [styles.badge_attention]: row.state === "waiting",
                    [styles.badge_positive]:
                      row.state === "matched" || row.state === "new-game",
                  })}
                >
                  {stateLabel(row.source, row.state)}
                </span>
              ),
            },
            reason: {
              content: row.reason ? REASON_LABELS[row.reason] : "—",
            },
            result: {
              content: row.winner ? (
                <Link
                  className={styles.rowCandidate}
                  href={`/games/${row.winner.slug}`}
                  target="_blank"
                  onClick={(event) => event.stopPropagation()}
                >
                  {row.winner.name}
                </Link>
              ) : (
                "—"
              ),
            },
          };

          return Object.fromEntries(
            Object.entries(cells).map(([key, cell]) => [
              key,
              { ...cell, className: styles.rowClickable, onClick: open },
            ])
          ) as Record<keyof typeof cells, ITableCell>;
        })}
      />

      <Pagination
        take={CONFLICTS_PAGE_SIZE}
        total={data?.total ?? 0}
        page={page}
        onPageChange={setPage}
        isDisabled={isFetching}
      />
    </div>
  );
};
