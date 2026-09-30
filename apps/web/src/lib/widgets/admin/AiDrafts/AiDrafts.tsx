"use client";

import { useState } from "react";
import classNames from "classnames";
import { IGameAiDraftRun } from "@mooncellar/schemas";
import { Button, ButtonColor } from "@/src/lib/shared/ui/Button";
import { TextField } from "@/src/lib/shared/ui/Fields";
import { Input } from "@/src/lib/shared/ui/Input";
import { commonUtils } from "@/src/lib/shared/utils/common.utils";
import styles from "./AiDrafts.module.scss";

export type IAiDraftRun<T> = Omit<IGameAiDraftRun, "draft"> & {
  draft: T | null;
  count?: number;
};

interface IAiDraftsProps<T> {
  label: string;
  runs: IAiDraftRun<T>[];
  isStarting: boolean;
  isRetrying: boolean;
  isDeleting: boolean;
  isReplacing: boolean;
  maxCount?: number;
  countLabel?: string;
  onStart: (query: string, count: number, onStarted: () => void) => void;
  onRetry: (id: string) => void;
  onDelete: (id: string) => void;
  onApply: (draft: T) => void;
}

const STATUS_LABELS: Record<IGameAiDraftRun["status"], string> = {
  running: "Running",
  done: "Done",
  failed: "Failed",
};

export const AiDrafts = <T,>({
  label,
  runs,
  isStarting,
  isRetrying,
  isDeleting,
  isReplacing,
  maxCount,
  countLabel,
  onStart,
  onRetry,
  onDelete,
  onApply,
}: IAiDraftsProps<T>) => {
  const [query, setQuery] = useState("");
  const [count, setCount] = useState(1);

  const handleStart = () => onStart(query.trim(), count, () => setQuery(""));

  return (
    <div className={styles.drafts}>
      <span className={styles.drafts__label}>{label}</span>
      <div className={styles.drafts__row}>
        <TextField
          label={label}
          value={query}
          disabled={isStarting}
          isLabelHidden
          onChange={setQuery}
        />
        {!!maxCount && (
          <label className={styles.drafts__count} title={countLabel}>
            <span className={styles.drafts__hidden}>{countLabel}</span>
            <Input
              type="number"
              value={count}
              disabled={isStarting}
              onChange={(event) =>
                setCount(
                  Math.min(
                    maxCount,
                    Math.max(1, Math.round(Number(event.target.value)) || 1)
                  )
                )
              }
            />
          </label>
        )}
        <Button
          type="button"
          color={ButtonColor.DEFAULT}
          disabled={isStarting || !query.trim()}
          onClick={handleStart}
        >
          Start
        </Button>
      </div>

      {!!runs.length && (
        <ul className={styles.drafts__list}>
          {runs.map((run) => (
            <li key={run._id} className={styles.run}>
              <div className={styles.run__main}>
                <span className={styles.run__query}>
                  {!!run.count && run.count > 1 && (
                    <span className={styles.run__count}>
                      Up to {run.count} characters ·{" "}
                    </span>
                  )}
                  {run.query}
                </span>
                <details className={styles.run__details}>
                  <summary>
                    {commonUtils.formatDate(run.createdAt, {
                      isWithTime: true,
                    })}
                    {" · "}
                    {run.status === "failed"
                      ? run.error
                      : run.steps[run.steps.length - 1]}
                  </summary>
                  <ol className={styles.run__steps}>
                    {run.steps.map((step, index) => (
                      <li key={index}>{step}</li>
                    ))}
                  </ol>
                </details>
              </div>
              <div className={styles.run__actions}>
                <span
                  className={classNames(
                    styles.run__status,
                    styles[`run__status_${run.status}`]
                  )}
                >
                  {STATUS_LABELS[run.status]}
                </span>
                <Button
                  type="button"
                  color={ButtonColor.DEFAULT}
                  disabled={run.status === "running" || !run.draft}
                  tooltip={
                    run.status === "failed" && run.draft
                      ? "Applies the draft from the last successful run"
                      : isReplacing && run.draft
                        ? "The form will be replaced by the draft"
                        : undefined
                  }
                  onClick={() => run.draft && onApply(run.draft)}
                >
                  Apply
                </Button>
                <Button
                  type="button"
                  color={ButtonColor.DEFAULT}
                  disabled={run.status === "running" || isRetrying}
                  onClick={() => onRetry(run._id)}
                >
                  Retry
                </Button>
                <Button
                  type="button"
                  color={ButtonColor.RED}
                  disabled={run.status === "running" || isDeleting}
                  onClick={() => onDelete(run._id)}
                >
                  Delete
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
