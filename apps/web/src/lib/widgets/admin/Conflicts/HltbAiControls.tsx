import { FC, useState } from "react";
import { hltbApi } from "@/src/lib/shared/api";
import { Button } from "@/src/lib/shared/ui/Button";
import { Checkbox } from "@/src/lib/shared/ui/Checkbox";
import { ConfirmModal } from "@/src/lib/shared/ui/ConfirmModal";
import { Input } from "@/src/lib/shared/ui/Input";
import { modal } from "@/src/lib/shared/ui/Modal";
import { toast } from "@/src/lib/shared/utils/toast.utils";
import styles from "./Conflicts.module.scss";

const UNDO_MODAL_ID = "undo-hltb-ai-matches";
const DEFAULT_LIMIT = "10";

interface IHltbAiControlsProps {
  isApplying: boolean;
}

export const HltbAiControls: FC<IHltbAiControlsProps> = ({ isApplying }) => {
  const [limit, setLimit] = useState(DEFAULT_LIMIT);
  const [isApply, setIsApply] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const count = Number(limit);

  const run = (request: () => Promise<{ data: { message: string } }>) => {
    setIsPending(true);

    return request()
      .then(({ data }) => toast.success({ description: data.message }))
      .finally(() => setIsPending(false));
  };

  const confirmUndo = () =>
    modal.open(
      <ConfirmModal
        title="Undo AI matches"
        message="Unlink every game the AI matched to HLTB and put those conflicts back in the queue?"
        warning="A field the HLTB page filled is cleared only if nobody changed it since. Matches made by hand stay."
        confirmText="Undo"
        onConfirm={() =>
          run(hltbApi.undoAiDecisions).then(() => modal.close(UNDO_MODAL_ID))
        }
        onCancel={() => modal.close(UNDO_MODAL_ID)}
      />,
      { id: UNDO_MODAL_ID }
    );

  return (
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
        conflicts without a verdict
      </label>
      <label className={styles.ai__field}>
        <Checkbox checked={isApply} onChange={() => setIsApply(!isApply)} />
        Apply confident matches, stored verdicts too
      </label>
      <Button
        disabled={isPending || !Number.isInteger(count) || count < 1}
        onClick={() =>
          run(() =>
            hltbApi.reviewConflicts({ limit: count, apply: isApply })
          ).catch(() => undefined)
        }
      >
        Ask AI
      </Button>
      <Button disabled={isPending || isApplying} onClick={confirmUndo}>
        Undo AI matches
      </Button>
    </div>
  );
};
