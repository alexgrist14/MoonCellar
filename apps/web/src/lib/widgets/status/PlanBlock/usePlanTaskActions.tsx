import { IPlanTask, IPlanTaskAction } from "@mooncellar/schemas";
import {
  useDeletePlanTaskMutation,
  usePlanTaskActionMutation,
} from "@/src/lib/entities/project/api";
import { ConfirmModal } from "@/src/lib/shared/ui/ConfirmModal";
import { drawer } from "@/src/lib/shared/ui/Drawer";
import { modal } from "@/src/lib/shared/ui/Modal";
import { PlanTaskForm } from "./PlanTaskForm";

const CONFIRM_MODAL_ID = "status-plan-confirm";
const FORM_MODAL_ID = "status-plan-task";

export const usePlanTaskActions = (slug: string) => {
  const { mutate: act, isPending } = usePlanTaskActionMutation(slug);
  const { mutateAsync: remove } = useDeletePlanTaskMutation(slug);

  const run = (task: IPlanTask, action: IPlanTaskAction, as?: string) =>
    act({ id: task.id, action, dto: { ...(as && { as }), force: true } });

  const edit = (task: IPlanTask, sectionId: string) =>
    modal.open(
      <PlanTaskForm
        slug={slug}
        task={task}
        sectionId={sectionId}
        onClose={() => modal.close(FORM_MODAL_ID)}
      />,
      { id: FORM_MODAL_ID }
    );

  const askDelete = (task: IPlanTask) =>
    modal.open(
      <ConfirmModal
        title={`Delete ${task.id}`}
        message={`Delete task ${task.id} from the plan?`}
        warning="Tasks that depend on it keep its id in their dependencies."
        confirmText="Delete"
        onCancel={() => modal.close(CONFIRM_MODAL_ID)}
        onConfirm={async () => {
          await remove(task.id);
          modal.close(CONFIRM_MODAL_ID);
          drawer.close();
        }}
      />,
      { id: CONFIRM_MODAL_ID }
    );

  return { run, edit, askDelete, isPending };
};

export const getTaskActionLabels = (task: IPlanTask) => ({
  take: task.state === "done" ? null : task.owner ? "Take over" : "Take",
  release: task.owner && task.state !== "done" ? "Release" : null,
  done: task.state === "done" ? null : "Mark done",
  reopen: task.state === "done" ? "Reopen" : null,
});
