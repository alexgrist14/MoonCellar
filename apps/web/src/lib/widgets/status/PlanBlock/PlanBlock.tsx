"use client";

import { FC, useState } from "react";
import { IPlanBlock, IPlanTask, IPlanTaskState } from "@mooncellar/schemas";
import { formatPercent } from "@/src/lib/entities/project/model";
import { Box } from "@/src/lib/shared/ui/Box";
import { DRAWER_TRIGGER_ATTRIBUTE, drawer } from "@/src/lib/shared/ui/Drawer";
import { ProgressBar } from "@/src/lib/shared/ui/ProgressBar";
import { StatTile } from "@/src/lib/shared/ui/StatTile";
import { Table } from "@/src/lib/shared/ui/Table";
import { Tabs } from "@/src/lib/shared/ui/Tabs";
import { PlanStateBadge } from "./PlanStateBadge";
import { PlanTaskDetails } from "./PlanTaskDetails";
import { PlanText } from "./PlanText";
import styles from "./PlanBlock.module.scss";

const FILTERS: { label: string; state: IPlanTaskState | null }[] = [
  { label: "All", state: null },
  { label: "In progress", state: "taken" },
  { label: "Free", state: "free" },
  { label: "Waiting", state: "waiting" },
  { label: "Done", state: "done" },
];

const STATE_ORDER: Record<IPlanTaskState, number> = {
  taken: 0,
  free: 1,
  waiting: 2,
  done: 3,
};

const trigger = { [DRAWER_TRIGGER_ATTRIBUTE]: "" };

export const PlanBlock: FC<{ plan: IPlanBlock }> = ({ plan }) => {
  const [filter, setFilter] = useState<IPlanTaskState | null>(null);
  const tasks = plan.sections.flatMap((section) => section.tasks);
  const count = (state: IPlanTaskState) =>
    tasks.filter((task) => task.state === state).length;
  const done = count("done");
  const owners = new Set(
    tasks.filter((task) => task.state === "taken").map((task) => task.owner)
  );
  const sections = plan.sections
    .map((section) => ({
      ...section,
      tasks: section.tasks.filter((task) => !filter || task.state === filter),
    }))
    .filter((section) => section.tasks.length);

  const openTask = (task: IPlanTask) =>
    drawer.open(<PlanTaskDetails task={task} />, { title: task.id });

  return (
    <>
      <Box>
        <div className={styles.summary}>
          <div className={styles.tiles}>
            <StatTile
              label="Tasks"
              value={tasks.length}
              hint={`in ${plan.sections.length} sections`}
            />
            <StatTile
              label="Done"
              value={done}
              hint={formatPercent(done, tasks.length)}
              valueColor="var(--color-positive)"
            />
            <StatTile
              label="In progress"
              value={count("taken")}
              hint={`${owners.size} ${owners.size === 1 ? "person" : "people"}`}
            />
            <StatTile label="Free" value={count("free")} hint="can be taken" />
            <StatTile
              label="Waiting"
              value={count("waiting")}
              hint="on other tasks"
              valueColor="var(--color-attention)"
            />
          </div>
          <ProgressBar
            value={done}
            max={Math.max(tasks.length, 1)}
            tone="positive"
            aria-label={`${done} of ${tasks.length} tasks done`}
          />
        </div>
      </Box>
      <Box
        title="Tasks"
        isTitleStart
        titleAction={
          <Tabs
            theme="segmented"
            ariaLabel="Show tasks"
            isWrap
            contents={FILTERS.map(({ label, state }) => ({
              tabName: label,
              count: state ? count(state) : tasks.length,
              onTabClick: () => setFilter(state),
            }))}
          />
        }
      >
        <div className={styles.sections}>
          {sections.map((section) => (
            <section key={section.id} className={styles.section}>
              <h3 className={styles.section__title}>
                {section.title}
                <span>
                  {section.tasks.filter((task) => task.state === "done").length}{" "}
                  of {section.tasks.length} done
                </span>
              </h3>
              <Table
                layout="rows"
                mobileHeadField="task"
              isWithoutMobileSorting
                initialSortingKey="state"
                initialSortingOrder="asc"
                columnStyles={{
                  id: { width: "72px", minWidth: "72px" },
                  task: { width: "1fr", minWidth: "220px" },
                  state: { width: "190px", minWidth: "150px" },
                  size: { width: "80px", minWidth: "80px" },
                }}
                headers={{
                  id: { content: "#" },
                  task: { content: "Task" },
                  state: { content: "State" },
                  size: { content: "Size" },
                }}
                onRowClick={(index) => openTask(section.tasks[index])}
                rows={section.tasks.map((task) => ({
                  id: {
                    content: (
                      <span {...trigger} className={styles.id}>
                        {task.id}
                      </span>
                    ),
                    sortingValue: task.id,
                  },
                  task: {
                    content: (
                      <span {...trigger} className={styles.task}>
                        <PlanText text={task.title} />
                      </span>
                    ),
                    sortingValue: task.title,
                  },
                  state: {
                    content: (
                      <span {...trigger}>
                        <PlanStateBadge task={task} />
                      </span>
                    ),
                    sortingValue: STATE_ORDER[task.state],
                  },
                  size: {
                    content: <span {...trigger}>{task.size ?? "—"}</span>,
                  },
                }))}
              />
            </section>
          ))}
        </div>
      </Box>
    </>
  );
};
