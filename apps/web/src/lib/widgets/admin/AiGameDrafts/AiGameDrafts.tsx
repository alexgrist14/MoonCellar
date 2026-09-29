"use client";

import { FC, useState } from "react";
import classNames from "classnames";
import { IAddGameRequest, IGameAiDraftRun } from "@mooncellar/schemas";
import { useGameAiDraftsQuery } from "@/src/lib/entities/game/api/game.queries";
import {
  useDeleteGameAiDraftMutation,
  useRetryGameAiDraftMutation,
  useStartGameAiDraftMutation,
} from "@/src/lib/entities/game/api/game.mutations";
import { Button, ButtonColor } from "@/src/lib/shared/ui/Button";
import { TextField } from "@/src/lib/shared/ui/Fields";
import { commonUtils } from "@/src/lib/shared/utils/common.utils";
import styles from "./AiGameDrafts.module.scss";

interface IAiGameDraftsProps {
  isReplacing: boolean;
  onApply: (draft: Partial<IAddGameRequest>) => void;
}

const STATUS_LABELS: Record<IGameAiDraftRun["status"], string> = {
  running: "Running",
  done: "Done",
  failed: "Failed",
};

export const AiGameDrafts: FC<IAiGameDraftsProps> = ({
  isReplacing,
  onApply,
}) => {
  const [query, setQuery] = useState("");
  const { data: runs = [] } = useGameAiDraftsQuery();
  const { mutate: startDraft, isPending } = useStartGameAiDraftMutation();
  const { mutate: deleteDraft, isPending: isDeleting } =
    useDeleteGameAiDraftMutation();
  const { mutate: retryDraft, isPending: isRetrying } =
    useRetryGameAiDraftMutation();

  const handleStart = () =>
    startDraft(query.trim(), { onSuccess: () => setQuery("") });

  return (
    <div className={styles.drafts}>
      <span className={styles.drafts__label}>
        Fill with AI: game name or link
      </span>
      <div className={styles.drafts__row}>
        <TextField
          label="Fill with AI: game name or link"
          value={query}
          disabled={isPending}
          isLabelHidden
          onChange={setQuery}
        />
        <Button
          type="button"
          color={ButtonColor.DEFAULT}
          disabled={isPending || !query.trim()}
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
                <span className={styles.run__query}>{run.query}</span>
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
                  disabled={run.status !== "done" || !run.draft}
                  tooltip={
                    isReplacing && run.status === "done"
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
                  onClick={() => retryDraft(run._id)}
                >
                  Retry
                </Button>
                <Button
                  type="button"
                  color={ButtonColor.RED}
                  disabled={run.status === "running" || isDeleting}
                  onClick={() => deleteDraft(run._id)}
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
