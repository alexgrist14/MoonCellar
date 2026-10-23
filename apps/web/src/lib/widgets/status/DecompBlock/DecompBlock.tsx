"use client";

import { FC, useState } from "react";
import classNames from "classnames";
import { IDecompBlock, IDecompUnit } from "@mooncellar/schemas";
import { formatPercent } from "@/src/lib/entities/project/model";
import { Badge } from "@/src/lib/shared/ui/Badge";
import { Box } from "@/src/lib/shared/ui/Box";
import { ProgressBar } from "@/src/lib/shared/ui/ProgressBar";
import { StatTile } from "@/src/lib/shared/ui/StatTile";
import { Table } from "@/src/lib/shared/ui/Table";
import { Tabs } from "@/src/lib/shared/ui/Tabs";
import { commonUtils } from "@/src/lib/shared/utils/common.utils";
import { FunctionMap, IFunctionMapOrder } from "./FunctionMap";
import styles from "./DecompBlock.module.scss";

type IFilesFilter = "work" | "free" | "done";

const FILE_FILTERS: { label: string; filter: IFilesFilter }[] = [
  { label: "In work", filter: "work" },
  { label: "Free", filter: "free" },
  { label: "Done", filter: "done" },
];

const isComplete = (unit: IDecompUnit) =>
  unit.functions > 0 && unit.done === unit.functions;

const matchesFilter = (unit: IDecompUnit, filter: IFilesFilter) => {
  if (filter === "done") return isComplete(unit);
  if (filter === "work") return !!unit.claimedBy || unit.pending > 0;
  return !isComplete(unit) && !unit.claimedBy;
};

const formatBytes = (bytes: number) =>
  bytes >= 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
    : `${Math.round(bytes / 1024)} KB`;

const LEGEND = [
  { label: "Done in main", token: "--color-positive" },
  { label: "Done in a branch", token: "--status-pending-color" },
  { label: "Claimed", token: "--color-accent" },
  { label: "Not started", token: "--color-bg-tertiary" },
];

const UnitState: FC<{ unit: IDecompUnit }> = ({ unit }) => {
  if (unit.claimedBy) {
    return (
      <Badge tone={isComplete(unit) ? "positive" : "accent"} isWithDot>
        {unit.claimedBy}
      </Badge>
    );
  }
  if (isComplete(unit))
    return (
      <Badge tone="positive" isWithDot>
        Done
      </Badge>
    );
  if (unit.pending > 0)
    return (
      <Badge tone="attention" isWithDot>
        Waiting to merge
      </Badge>
    );
  return (
    <Badge tone="muted" isWithDot>
      Free
    </Badge>
  );
};

export const DecompBlock: FC<{ decomp: IDecompBlock }> = ({ decomp }) => {
  const [filter, setFilter] = useState<IFilesFilter>("work");
  const [mapOrder, setMapOrder] = useState<IFunctionMapOrder>("status");
  const { totals } = decomp;
  const units = decomp.units.filter((unit) => matchesFilter(unit, filter));

  return (
    <>
      <Box>
        <div className={styles.tiles}>
          <StatTile
            label="Functions"
            value={totals.done.toLocaleString("en")}
            hint={`of ${totals.functions.toLocaleString("en")} · ${formatPercent(totals.done, totals.functions)}`}
            valueColor="var(--color-positive)"
          />
          <StatTile
            label="By bytes"
            value={formatPercent(totals.bytesDone, totals.bytes)}
            hint={`${formatBytes(totals.bytesDone)} of ${formatBytes(totals.bytes)}`}
          />
          <StatTile
            label="In work"
            value={totals.claimed}
            hint="files claimed"
          />
          <StatTile
            label="Waiting to merge"
            value={totals.pending.toLocaleString("en")}
            hint="functions in work branches"
          />
        </div>
      </Box>

      <div className={styles.split}>
        <Box title="Categories" isTitleStart>
          <div className={styles.categories}>
            {decomp.categories.map((category) => (
              <div key={category.id} className={styles.category}>
                <span className={styles.category__name}>{category.id}</span>
                <ProgressBar
                  value={category.done}
                  max={Math.max(category.functions, 1)}
                  tone="positive"
                  aria-label={`${category.id}: ${category.done} of ${category.functions}`}
                />
                <span className={styles.category__count}>
                  {category.done.toLocaleString("en")} /{" "}
                  {category.functions.toLocaleString("en")}
                </span>
              </div>
            ))}
          </div>
        </Box>
        <Box title="Areas" isTitleStart>
          <Table
            mobileHeadField="area"
            isWithoutMobileSorting
            initialSortingKey="area"
            initialSortingOrder="asc"
            columnStyles={{
              area: { width: "1fr", minWidth: "100px" },
              owners: { width: "1fr", minWidth: "120px" },
              done: { width: "104px", minWidth: "104px" },
            }}
            headers={{
              area: { content: "Area" },
              owners: { content: "Led by" },
              done: { content: "Done" },
            }}
            rows={decomp.areas.map((area) => ({
              area: { content: area.title ?? area.id, sortingValue: area.id },
              owners: { content: area.owners.join(", ") || "—" },
              done: {
                content: formatPercent(area.done, area.functions),
                sortingValue: area.functions ? area.done / area.functions : 0,
              },
            }))}
          />
        </Box>
      </div>

      <Box
        title="Function map"
        isTitleStart
        titleAction={
          <div className={styles.mapActions}>
            <ul className={styles.legend}>
              {LEGEND.map(({ label, token }) => (
                <li key={label}>
                  <i style={{ backgroundColor: `var(${token})` }} />
                  {label}
                </li>
              ))}
            </ul>
            <Tabs
              theme="segmented"
              ariaLabel="Order the map"
              contents={[
                {
                  tabName: "By status",
                  onTabClick: () => setMapOrder("status"),
                },
                {
                  tabName: "By address",
                  onTabClick: () => setMapOrder("address"),
                },
              ]}
            />
          </div>
        }
      >
        <FunctionMap map={decomp.map} order={mapOrder} />
      </Box>

      <div className={styles.split}>
        <Box
          title="Files"
          isTitleStart
          titleAction={
            <Tabs
              theme="segmented"
              ariaLabel="Show files"
              contents={FILE_FILTERS.map(({ label, filter: value }) => ({
                tabName: label,
                count: decomp.units.filter((unit) => matchesFilter(unit, value))
                  .length,
                onTabClick: () => setFilter(value),
              }))}
            />
          }
        >
          <Table
            mobileHeadField="file"
            initialSortingKey="file"
            initialSortingOrder="asc"
            columnStyles={{
              file: { width: "1fr", minWidth: "200px" },
              functions: { width: "110px", minWidth: "90px" },
              state: { width: "160px", minWidth: "130px" },
            }}
            headers={{
              file: { content: "File" },
              functions: { content: "Functions" },
              state: { content: "State" },
            }}
            rows={units.map((unit) => ({
              file: {
                content: <span className={styles.file}>{unit.id}</span>,
                sortingValue: unit.id,
                title: unit.note,
              },
              functions: {
                content: `${unit.done} / ${unit.functions}`,
                sortingValue: unit.functions ? unit.done / unit.functions : 0,
              },
              state: {
                content: <UnitState unit={unit} />,
                sortingValue: unit.claimedBy ?? "",
              },
            }))}
          />
        </Box>
        <Box title="Feed" isTitleStart>
          <ul className={styles.feed}>
            {decomp.events.map((event, index) => (
              <li key={`${event.at}-${index}`} className={styles.feed__item}>
                <i
                  className={classNames(
                    styles.feed__dot,
                    styles[`feed__dot_${event.kind}`]
                  )}
                />
                <span>{event.text}</span>
                <time dateTime={event.at} className={styles.feed__time}>
                  {commonUtils.getHumanDate(event.at)}
                </time>
              </li>
            ))}
          </ul>
        </Box>
      </div>
    </>
  );
};
