import { FC, useState } from "react";
import { IPlanSection, PlanSectionIdSchema } from "@mooncellar/schemas";
import {
  useCreatePlanSectionMutation,
  useUpdatePlanSectionMutation,
} from "@/src/lib/entities/project/api";
import { Box } from "@/src/lib/shared/ui/Box";
import { Button, ButtonColor } from "@/src/lib/shared/ui/Button";
import { TextField } from "@/src/lib/shared/ui/Fields";
import styles from "./PlanBlock.module.scss";

interface IPlanSectionFormProps {
  slug: string;
  section?: Pick<IPlanSection, "id" | "title">;
  onClose: () => void;
}

export const PlanSectionForm: FC<IPlanSectionFormProps> = ({
  slug,
  section,
  onClose,
}) => {
  const [id, setId] = useState("");
  const [title, setTitle] = useState(section?.title ?? "");
  const create = useCreatePlanSectionMutation(slug);
  const update = useUpdatePlanSectionMutation(slug);
  const isPending = create.isPending || update.isPending;
  const idError =
    id && !PlanSectionIdSchema.safeParse(id).success
      ? "One to three capital letters, like H"
      : undefined;

  const save = () =>
    section
      ? update.mutate(
          { id: section.id, dto: { title: title.trim() } },
          { onSuccess: onClose }
        )
      : create.mutate(
          { title: title.trim(), ...(id && { id }) },
          { onSuccess: onClose }
        );

  return (
    <Box
      title={section ? `Rename section ${section.id}` : "New section"}
      isTitleStart
      onClose={onClose}
      wrapperStyle={{ width: "var(--status-edit-modal-width)" }}
    >
      <div className={styles.form}>
        {!section && (
          <TextField
            label="Letter (empty: the first free one)"
            value={id}
            error={idError}
            onChange={(value) => setId(value.toUpperCase())}
          />
        )}
        <TextField label="Title" value={title} onChange={setTitle} />
        <div className={styles.form__actions}>
          <Button color={ButtonColor.TRANSPARENT} onClick={onClose}>
            Cancel
          </Button>
          <Button
            color={ButtonColor.ACCENT}
            disabled={!title.trim() || !!idError || isPending}
            isLoading={isPending}
            onClick={save}
          >
            {section ? "Save" : "Add section"}
          </Button>
        </div>
      </div>
    </Box>
  );
};
