import { ComponentProps, FC, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { IConflictsAiStatus, IConflictSource } from "@mooncellar/schemas";
import {
  conflictQueryKeys,
  useConflictsAiStatusQuery,
} from "@/src/lib/entities/conflict/api";
import { adminConflictsApi } from "@/src/lib/shared/api";
import { Button } from "@/src/lib/shared/ui/Button";
import { ConfirmModal } from "@/src/lib/shared/ui/ConfirmModal";
import { Input } from "@/src/lib/shared/ui/Input";
import { modal } from "@/src/lib/shared/ui/Modal";
import { ProgressBar } from "@/src/lib/shared/ui/ProgressBar";
import { DRAWER_TRIGGER_ATTRIBUTE, drawer } from "@/src/lib/shared/ui/Drawer";
import { toast } from "@/src/lib/shared/utils/toast.utils";
import {
  canAiCreate,
  CONFLICT_SOURCES,
  isUndoable,
  SOURCE_LABELS,
} from "./labels";
import { AiUndoPanel } from "./AiUndoPanel";
import styles from "./Conflicts.module.scss";

const APPLY_MODAL_ID = "apply-ai-verdicts";
const CREATE_MODAL_ID = "create-ai-games";
const DEFAULT_LIMIT = "10";

const ACTION_LABELS: Record<
  NonNullable<IConflictsAiStatus["action"]>,
  string
> = {
  review: "Dry run",
  apply: "Applying verdicts",
  create: "Adding games",
  undo: "Undoing AI matches",
};

const NOTHING_TO_DO: Record<
  NonNullable<IConflictsAiStatus["action"]>,
  string
> = {
  review: "no waiting conflict is left without a verdict",
  apply: "nothing to apply: no waiting conflict has a high-confidence match",
  create:
    "nothing to add: no waiting game entry has a high-confidence no-match verdict",
  undo: "no AI match to undo",
};

const isNothingToDo = (status: IConflictsAiStatus) =>
  !status.isRunning && !status.total && !status.error && !!status.action;

const progressText = (status: IConflictsAiStatus) => {
  if (isNothingToDo(status)) {
    return [
      ACTION_LABELS[status.action!],
      status.source ? SOURCE_LABELS[status.source] : "All sources",
      NOTHING_TO_DO[status.action!],
    ].join(" · ");
  }

  const counts =
    status.action === "undo"
      ? [`${status.undone} undone`]
      : status.action === "apply"
        ? [`${status.decided} matched`]
        : status.action === "create"
          ? [`${status.decided} queued as new games`]
          : [
              `${status.judged} judged`,
              `${status.matches} confident`,
              ...(status.failed ? [`${status.failed} failed`] : []),
            ];

  return [
    status.action ? ACTION_LABELS[status.action] : "AI",
    status.source ? SOURCE_LABELS[status.source] : "All sources",
    status.isRunning && !status.total
      ? "counting conflicts…"
      : `${status.done} of ${status.total}`,
    ...counts,
    ...(status.isRunning ? [] : [status.error ? "stopped" : "finished"]),
  ].join(" · ");
};

interface IAiControlsProps {
  source?: IConflictSource;
  isApplying: boolean;
}

export const AiControls: FC<IAiControlsProps> = ({ source, isApplying }) => {
  const [limit, setLimit] = useState(DEFAULT_LIMIT);
  const [isPending, setIsPending] = useState(false);
  const queryClient = useQueryClient();
  const { data: status, refetch } = useConflictsAiStatusQuery();
  const isRunning = !!status?.isRunning;
  const finishedAt = status ? status.finishedAt : undefined;
  const seenFinishedAt = useRef(finishedAt);
  const isBusy = isPending || isRunning;
  const count = Number(limit);
  const undoable = (source ? [source] : CONFLICT_SOURCES).filter(isUndoable);
  const undoableLabel = undoable.map((name) => SOURCE_LABELS[name]).join(", ");
  const creatable = (source ? [source] : CONFLICT_SOURCES).filter(canAiCreate);
  const scope = source ? `${SOURCE_LABELS[source]} ` : "";

  const run = (request: () => Promise<{ data: { message: string } }>) => {
    setIsPending(true);

    return request()
      .then(({ data }) => {
        toast.success({ description: data.message });
        void refetch();
      })
      .finally(() => setIsPending(false));
  };

  useEffect(() => {
    if (finishedAt === undefined) return;

    if (
      seenFinishedAt.current !== undefined &&
      finishedAt &&
      finishedAt !== seenFinishedAt.current
    ) {
      void queryClient.invalidateQueries({
        queryKey: conflictQueryKeys.listAll(),
      });
      void queryClient.invalidateQueries({
        queryKey: conflictQueryKeys.summaryAll(),
      });
      void queryClient.invalidateQueries({
        queryKey: conflictQueryKeys.aiMatchesAll(),
      });
    }

    seenFinishedAt.current = finishedAt;
  }, [finishedAt, queryClient]);

  const confirm = (
    id: string,
    props: Pick<
      ComponentProps<typeof ConfirmModal>,
      "title" | "message" | "warning" | "confirmText"
    >,
    request: () => Promise<{ data: { message: string } }>
  ) =>
    modal.open(
      <ConfirmModal
        {...props}
        onConfirm={() => run(request).then(() => modal.close(id))}
        onCancel={() => modal.close(id)}
      />,
      { id }
    );

  return (
    <div className={styles.aiPanel}>
      <div className={styles.ai}>
        <label className={styles.ai__field}>
          Judge
          <span className={styles.ai__limit}>
            <Input
              type="number"
              min={1}
              step={1}
              inputMode="numeric"
              value={limit}
              aria-label="Conflicts to judge"
              onChange={(event) => setLimit(event.target.value)}
            />
          </span>
          {source ? "conflicts" : "conflicts of each source"} without a verdict
        </label>
        <Button
          disabled={isBusy || !Number.isInteger(count) || count < 1}
          onClick={() =>
            run(() =>
              adminConflictsApi.reviewWithAi(source, {
                limit: count,
                apply: false,
              })
            ).catch(() => undefined)
          }
        >
          Ask AI
        </Button>
        <Button
          disabled={isBusy}
          onClick={() =>
            confirm(
              APPLY_MODAL_ID,
              {
                title: "Apply AI verdicts",
                message: `Match every waiting ${scope}conflict whose stored AI verdict is confident?`,
                warning: !source
                  ? `Only ${undoableLabel} matches can be undone; the others are permanent. Check the verdicts with "Only judged by AI" first.`
                  : undoable.length
                    ? "Undo AI matches takes them back."
                    : `${SOURCE_LABELS[source]} matches cannot be undone. Check the verdicts with "Only judged by AI" first.`,
                confirmText: "Apply",
              },
              () =>
                adminConflictsApi.reviewWithAi(source, {
                  limit: 0,
                  apply: true,
                })
            )
          }
        >
          Apply verdicts
        </Button>
        {!!creatable.length && (
          <Button
            disabled={isBusy}
            onClick={() =>
              confirm(
                CREATE_MODAL_ID,
                {
                  title: "Add games from AI verdicts",
                  message: `Add a new game for every waiting ${creatable.map((name) => SOURCE_LABELS[name]).join(", ")} conflict whose AI verdict says, with high confidence, that no candidate is the entry? Add-ons, mods and hacks are left alone.`,
                  warning:
                    'Check the "no match" verdicts first. A game added this way is removed by opening its conflict and pressing Undo new game, as long as nobody has used it yet.',
                  confirmText: "Add games",
                },
                () => adminConflictsApi.createWithAi(source)
              )
            }
          >
            Add games for no match
          </Button>
        )}
        {!!undoable.length && (
          <Button
            disabled={isBusy || isApplying}
            {...{ [DRAWER_TRIGGER_ATTRIBUTE]: "" }}
            onClick={() =>
              drawer.open(
                <AiUndoPanel
                  source={source}
                  onStarted={() => void refetch()}
                />,
                { title: `Undo AI matches · ${undoableLabel}` }
              )
            }
          >
            Undo AI matches
          </Button>
        )}
      </div>
      {!!status?.startedAt && (
        <div className={styles.aiProgress}>
          <ProgressBar
            value={
              isRunning && !status.total
                ? undefined
                : isNothingToDo(status)
                  ? 1
                  : status.done
            }
            max={status.total || 1}
            tone={status.error ? "negative" : isRunning ? "accent" : "neutral"}
            aria-label={`AI job: ${status.done} of ${status.total} conflicts`}
          />
          <p className={styles.aiProgress__text}>{progressText(status)}</p>
          {!!status.error && (
            <p className={styles.aiProgress__error}>{status.error}</p>
          )}
        </div>
      )}
    </div>
  );
};
