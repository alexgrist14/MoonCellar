import { FC, useState } from "react";
import {
  CreateProjectRequestSchema,
  IProject,
  IProjectBlock,
  PROJECT_BLOCKS,
} from "@mooncellar/schemas";
import { PROJECT_BLOCK_TITLES } from "@/src/lib/entities/project/model";
import { Button, ButtonColor } from "@/src/lib/shared/ui/Button";
import { TextField, ToggleField } from "@/src/lib/shared/ui/Fields";
import { toSlug } from "@/src/lib/shared/utils/slug.utils";
import styles from "./ProjectsManager.module.scss";

export interface IProjectFormValues {
  name: string;
  slug: string;
  blocks: IProjectBlock[];
}

interface IProjectFormProps {
  project?: IProject;
  isPending: boolean;
  submitText: string;
  onSubmit: (values: IProjectFormValues) => void;
  onCancel?: () => void;
}

export const ProjectForm: FC<IProjectFormProps> = ({
  project,
  isPending,
  submitText,
  onSubmit,
  onCancel,
}) => {
  const [name, setName] = useState(project?.name ?? "");
  const [slug, setSlug] = useState(project?.slug ?? "");
  const [isSlugEdited, setIsSlugEdited] = useState(!!project);
  const [blocks, setBlocks] = useState<IProjectBlock[]>(
    project?.blocks ?? ["plan"]
  );
  const parsed = CreateProjectRequestSchema.safeParse({ name, slug, blocks });
  const slugError =
    slug && !parsed.success
      ? parsed.error.issues.find((issue) => issue.path[0] === "slug")?.message
      : undefined;

  const changeName = (value: string) => {
    setName(value);
    if (!isSlugEdited) setSlug(toSlug(value));
  };

  const toggleBlock = (block: IProjectBlock, isOn: boolean) =>
    setBlocks((current) =>
      isOn ? [...current, block] : current.filter((value) => value !== block)
    );

  return (
    <div className={styles.form}>
      <div className={styles.form__fields}>
        <TextField label="Name" value={name} onChange={changeName} />
        <TextField
          label="Address"
          value={slug}
          disabled={!!project}
          error={slugError}
          onChange={(value) => {
            setIsSlugEdited(true);
            setSlug(value);
          }}
        />
      </div>
      <div className={styles.form__blocks}>
        {PROJECT_BLOCKS.map((block) => (
          <ToggleField
            key={block}
            label={PROJECT_BLOCK_TITLES[block]}
            labelPosition="end"
            value={blocks.includes(block)}
            onChange={(isOn) => toggleBlock(block, isOn)}
          />
        ))}
      </div>
      {project && (
        <p className={styles.hint}>
          Turning a block off deletes what the project uploaded for it.
        </p>
      )}
      <div className={styles.form__actions}>
        {onCancel && (
          <Button color={ButtonColor.TRANSPARENT} onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button
          color={ButtonColor.ACCENT}
          disabled={!parsed.success || isPending}
          isLoading={isPending}
          onClick={() => parsed.success && onSubmit(parsed.data)}
        >
          {submitText}
        </Button>
      </div>
    </div>
  );
};
