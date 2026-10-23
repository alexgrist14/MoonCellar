import { FC, useState } from "react";
import { CreatePlanTaskRequestSchema, IPlanTask } from "@mooncellar/schemas";
import {
  useCreatePlanTaskMutation,
  useProjectPlanQuery,
  useUpdatePlanTaskMutation,
} from "@/src/lib/entities/project/api";
import { Box } from "@/src/lib/shared/ui/Box";
import { Button, ButtonColor } from "@/src/lib/shared/ui/Button";
import {
  EnumField,
  StringListField,
  TextField,
  TextareaField,
} from "@/src/lib/shared/ui/Fields";
import styles from "./PlanBlock.module.scss";

const SIZES = ["S", "M", "L"];

interface IPlanTaskFormProps {
  slug: string;
  task?: IPlanTask;
  sectionId: string;
  onClose: () => void;
}

export const PlanTaskForm: FC<IPlanTaskFormProps> = ({
  slug,
  task,
  sectionId,
  onClose,
}) => {
  const { data: plan } = useProjectPlanQuery(slug, true);
  const sections = plan?.sections ?? [];
  const sectionLabel = (id: string) =>
    `${id} · ${sections.find((section) => section.id === id)?.title ?? ""}`;
  const [section, setSection] = useState(sectionId);
  const [title, setTitle] = useState(task?.title ?? "");
  const [where, setWhere] = useState(task?.where ?? "");
  const [depends, setDepends] = useState<string[]>(task?.depends ?? []);
  const [doneWhen, setDoneWhen] = useState(task?.doneWhen ?? "");
  const [size, setSize] = useState<string | undefined>(task?.size);
  const create = useCreatePlanTaskMutation(slug);
  const update = useUpdatePlanTaskMutation(slug);
  const isPending = create.isPending || update.isPending;
  const values = {
    section,
    title: title.trim(),
    where: where.trim(),
    depends: depends.map((id) => id.trim().toUpperCase()).filter(Boolean),
    doneWhen: doneWhen.trim(),
    size: size ?? "",
  };
  const isValid = CreatePlanTaskRequestSchema.safeParse(values).success;

  const save = () =>
    task
      ? update.mutate({ id: task.id, dto: values }, { onSuccess: onClose })
      : create.mutate(values, { onSuccess: onClose });

  return (
    <Box
      title={task ? `Edit ${task.id}` : "New task"}
      isTitleStart
      onClose={onClose}
      isWithScrollBar
      wrapperStyle={{ width: "var(--status-edit-modal-width)" }}
    >
      <div className={styles.form}>
        <EnumField
          label="Section"
          value={sectionLabel(section)}
          options={sections.map((item) => sectionLabel(item.id))}
          onChange={(label) => label && setSection(label.split(" · ")[0])}
        />
        <TextareaField label="Task" value={title} onChange={setTitle} />
        <TextField label="Where" value={where} onChange={setWhere} />
        <StringListField
          label="Depends on (task ids)"
          value={depends}
          onChange={setDepends}
        />
        <TextareaField
          label="Done when"
          value={doneWhen}
          onChange={setDoneWhen}
        />
        <EnumField
          label="Size"
          value={size}
          options={SIZES}
          placeholder="Not sized"
          onChange={setSize}
        />
        <div className={styles.form__actions}>
          <Button color={ButtonColor.TRANSPARENT} onClick={onClose}>
            Cancel
          </Button>
          <Button
            color={ButtonColor.ACCENT}
            disabled={!isValid || isPending}
            isLoading={isPending}
            onClick={save}
          >
            {task ? "Save" : "Add task"}
          </Button>
        </div>
      </div>
    </Box>
  );
};
