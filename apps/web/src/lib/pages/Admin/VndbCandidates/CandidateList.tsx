import { FC, useState } from "react";
import Link from "next/link";
import classNames from "classnames";
import { useDebouncedCallback } from "use-debounce";
import { VNDB_CANDIDATES_PAGE_SIZE } from "@mooncellar/schemas";
import { Input } from "@/src/lib/shared/ui/Input";
import { Table } from "@/src/lib/shared/ui/Table";
import { Pagination } from "@/src/lib/shared/ui/Pagination";
import { useVndbCandidatesQuery } from "@/src/lib/entities/game/api/vndb-candidates.queries";
import { REASON_LABELS, STATE_LABELS } from "./labels";
import styles from "./VndbCandidates.module.scss";

const SEARCH_DELAY_MS = 300;

export const CandidateList: FC = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [inputValue, setInputValue] = useState("");

  const { data, isLoading, isFetching } = useVndbCandidatesQuery({
    page,
    take: VNDB_CANDIDATES_PAGE_SIZE,
    search: search || undefined,
  });

  const debouncedSearch = useDebouncedCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, SEARCH_DELAY_MS);

  const rows = data?.results ?? [];

  return (
    <div className={styles.list}>
      <div className={styles.search}>
        <Input
          value={inputValue}
          placeholder="Search a VN or a candidate name"
          onChange={(event) => {
            setInputValue(event.target.value);
            debouncedSearch(event.target.value);
          }}
        />
      </div>

      <Table
        mobileHeadField="vn"
        isLoading={isLoading}
        limit={VNDB_CANDIDATES_PAGE_SIZE}
        headers={{
          vn: { content: "Visual novel" },
          state: { content: "State" },
          reason: { content: "Why it waits" },
          candidates: { content: "Candidates" },
          result: { content: "Result" },
        }}
        rows={rows.map((row) => ({
          vn: {
            content: (
              <div className={styles.rowVn}>
                <span className={styles.rowName}>{row.vnName}</span>
                <a
                  className={styles.rowLink}
                  href={`https://vndb.org/${row.vnId}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {row.vnId}
                </a>
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
                {STATE_LABELS[row.state]}
              </span>
            ),
          },
          reason: {
            content: row.reason ? REASON_LABELS[row.reason] : "—",
          },
          candidates: {
            content: row.candidates.length ? (
              <div className={styles.rowCandidates}>
                {row.candidates.map(({ gameId, name, slug, score }) => (
                  <Link
                    key={gameId}
                    className={styles.rowCandidate}
                    href={`/games/${slug}`}
                    target="_blank"
                  >
                    {name} <span className={styles.rowScore}>{score}</span>
                  </Link>
                ))}
              </div>
            ) : (
              "—"
            ),
          },
          result: {
            content: row.winner ? (
              <Link
                className={styles.rowCandidate}
                href={`/games/${row.winner.slug}`}
                target="_blank"
              >
                {row.winner.name}
              </Link>
            ) : (
              "—"
            ),
          },
        }))}
      />

      <Pagination
        take={VNDB_CANDIDATES_PAGE_SIZE}
        total={data?.total ?? 0}
        page={page}
        onPageChange={setPage}
        isDisabled={isFetching}
      />
    </div>
  );
};
