import { FC, useState } from "react";
import Link from "next/link";
import { useDebouncedCallback } from "use-debounce";
import {
  CONFLICTS_PAGE_SIZE,
  ICustomListsOrder,
  IConflictSource,
  IConflictState,
  IConflictsSort,
} from "@mooncellar/schemas";
import { Input } from "@/src/lib/shared/ui/Input";
import { Dropdown } from "@/src/lib/shared/ui/Dropdown";
import { Table } from "@/src/lib/shared/ui/Table";
import { Badge } from "@/src/lib/shared/ui/Badge";
import { Button } from "@/src/lib/shared/ui/Button";
import { Checkbox } from "@/src/lib/shared/ui/Checkbox";
import { DRAWER_TRIGGER_ATTRIBUTE, drawer } from "@/src/lib/shared/ui/Drawer";
import { Pagination } from "@/src/lib/shared/ui/Pagination";
import {
  ISortControlOption,
  SortControl,
} from "@/src/lib/shared/ui/SortControl";
import { useConflictsQuery } from "@/src/lib/entities/conflict/api";
import { setAdminQuery } from "@/src/lib/shared/utils/admin-url.utils";
import {
  aiVerdictTone,
  REASON_LABELS,
  SOURCE_LABELS,
  stateLabel,
  CONFLICT_STATES,
  stateTone,
  externalUrl,
} from "./labels";
import { AiVerdictDetails } from "./AiVerdictDetails";
import styles from "./Conflicts.module.scss";

const SEARCH_DELAY_MS = 300;
const ALL_STATES = "All states";

interface IConflictListProps {
  source?: IConflictSource;
}

const SORT_OPTIONS: ISortControlOption<IConflictsSort>[] = [
  { value: "ai", label: "AI verdict" },
];

export const ConflictList: FC<IConflictListProps> = ({ source }) => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [state, setState] = useState<IConflictState | undefined>("waiting");
  const [isAiOnly, setIsAiOnly] = useState(false);
  const [sortBy, setSortBy] = useState<IConflictsSort>();
  const [sortOrder, setSortOrder] = useState<ICustomListsOrder>("desc");
  const { data, isLoading, isFetching } = useConflictsQuery({
    page,
    take: CONFLICTS_PAGE_SIZE,
    search: search || undefined,
    source,
    state,
    aiOnly: isAiOnly || undefined,
    sortBy: sortBy ?? "queue",
    sortOrder,
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
        <div className={styles.stateFilter}>
          <Dropdown
            list={[
              ALL_STATES,
              ...CONFLICT_STATES.map(stateLabel),
            ]}
            overwriteValue={state ? stateLabel(state) : ALL_STATES}
            getIndex={(index) => {
              setState(index > 0 ? CONFLICT_STATES[index - 1] : undefined);
              setPage(1);
            }}
          />
        </div>
        <label className={styles.ai__field}>
          <Checkbox
            checked={isAiOnly}
            onChange={() => {
              setIsAiOnly(!isAiOnly);
              setPage(1);
            }}
          />
          Only judged by AI
        </label>
        <SortControl
          className={styles.sortFilter}
          options={SORT_OPTIONS}
          sortBy={sortBy}
          sortOrder={sortOrder}
          placeholder="Queue order"
          isWithReset
          onChange={(by, order) => {
            setSortBy(by);
            setSortOrder(order);
            setPage(1);
          }}
        />
      </div>

      <Table
        key={`${sortBy ?? "queue"}-${sortOrder}`}
        mobileHeadField="entry"
        initialSortingKey={sortBy === "ai" ? "ai" : undefined}
        initialSortingOrder={sortOrder}
        sortingCallback={(key, order) => {
          if (key !== "ai") return;
          setSortBy("ai");
          setSortOrder(order);
          setPage(1);
        }}
        onSortingReset={() => {
          setSortBy(undefined);
          setSortOrder("desc");
          setPage(1);
        }}
        isLoading={isLoading}
        limit={CONFLICTS_PAGE_SIZE}
        headers={{
          entry: { content: "Entry", isNotSortable: true },
          state: { content: "State", isNotSortable: true },
          reason: { content: "Why it waits", isNotSortable: true },
          result: { content: "Result", isNotSortable: true },
          ai: { content: "AI verdict" },
        }}
        rowClickExcludeKeys={["ai"]}
        onRowClick={(index) =>
          setAdminQuery({
            source: rows[index].source,
            conflict: rows[index].externalId,
          })
        }
        rows={rows.map((row) => ({
          entry: {
            content: (
              <div className={styles.rowVn}>
                <span className={styles.rowName}>{row.externalName}</span>
                {externalUrl(row.source, row.externalId) ? (
                  <a
                    className={styles.rowLink}
                    href={externalUrl(row.source, row.externalId) ?? undefined}
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
              <Badge tone={stateTone(row.state)}>
                {stateLabel(row.state)}
              </Badge>
            ),
          },
          reason: {
            content: row.reason ? REASON_LABELS[row.reason] : "—",
          },
          result: {
            content: row.winners.length
              ? row.winners.map((winner) => (
                  <Link
                    key={winner._id}
                    className={styles.rowCandidate}
                    href={`/games/${winner.slug}`}
                    target="_blank"
                    onClick={(event) => event.stopPropagation()}
                  >
                    {winner.name}
                  </Link>
                ))
              : "—",
          },
          ai: {
            content: row.aiVerdict ? (
              <div className={styles.rowVerdict}>
                <Badge tone={aiVerdictTone(row.aiVerdict)}>
                  {row.aiVerdict.confidence}
                  {!row.aiVerdict.gameIds.length && " · no match"}
                  {row.aiVerdict.undoneAt && " · undone"}
                </Badge>
                <Button
                  compact
                  {...{ [DRAWER_TRIGGER_ATTRIBUTE]: "" }}
                  onClick={() =>
                    drawer.open(<AiVerdictDetails row={row} />, {
                      title: "AI verdict",
                    })
                  }
                >
                  Details
                </Button>
              </div>
            ) : (
              "—"
            ),
          },
        }))}
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
