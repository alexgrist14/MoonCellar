import { FC, useState } from "react";
import { IMAGE_PROMPT_MAX_LENGTH } from "@mooncellar/schemas";
import { ActionsMenu, IActionsMenuItem } from "@/src/lib/shared/ui/ActionsMenu";
import { Button, ButtonColor } from "@/src/lib/shared/ui/Button";
import { Textarea } from "@/src/lib/shared/ui/Textarea";
import styles from "./ImageGenerator.module.scss";

type IBusyState = "generating" | "saving" | "deleting";

interface IRowActionsProps {
  prompt: string;
  busyState?: IBusyState;
  isSaved: boolean;
  isElement: boolean;
  isRemote: boolean;
  hasUnsavedSet: boolean;
  onUploadSet: () => void;
  onUpload: () => void;
  onRegenerate: (prompt: string) => void;
  onElements: () => void;
  onDownload: () => void;
  onDelete: () => void;
}

const BUSY_LABELS: Record<IBusyState, string> = {
  generating: "Generating…",
  saving: "Uploading…",
  deleting: "Deleting…",
};

interface IPromptFormProps {
  prompt: string;
  onBack: () => void;
  onSubmit: (prompt: string) => void;
}

const PromptForm: FC<IPromptFormProps> = ({ prompt, onBack, onSubmit }) => {
  const [value, setValue] = useState(prompt);

  return (
    <div className={styles.popover}>
      <Textarea
        value={value}
        rows={5}
        placeholder="Describe the image"
        onChange={(event) =>
          setValue(event.target.value.slice(0, IMAGE_PROMPT_MAX_LENGTH))
        }
      />
      <div className={styles.popover__actions}>
        <Button color={ButtonColor.DEFAULT} onClick={onBack}>
          Back
        </Button>
        <Button
          color={ButtonColor.ACCENT}
          disabled={!value.trim()}
          onClick={() => onSubmit(value.trim())}
        >
          Generate
        </Button>
      </div>
    </div>
  );
};

export const RowActions: FC<IRowActionsProps> = ({
  prompt,
  busyState,
  isSaved,
  isElement,
  isRemote,
  hasUnsavedSet,
  onUploadSet,
  onUpload,
  onRegenerate,
  onElements,
  onDownload,
  onDelete,
}) => {
  const items: (IActionsMenuItem | false)[] = [
    hasUnsavedSet && { label: "Upload set to S3", onClick: onUploadSet },
    !isSaved && { label: "Upload to S3", onClick: onUpload },
    !isRemote && {
      label: "Regenerate…",
      panel: {
        title: "Regenerate",
        width: "360px",
        render: ({ back, close }) => (
          <PromptForm
            prompt={prompt}
            onBack={back}
            onSubmit={(value) => {
              close();
              onRegenerate(value);
            }}
          />
        ),
      },
    },
    !isElement &&
      !isRemote && { label: "Split into elements…", onClick: onElements },
    { label: "Download", onClick: onDownload },
    { label: "Delete", isDanger: true, onClick: onDelete },
  ];

  return (
    <ActionsMenu
      label={busyState ? BUSY_LABELS[busyState] : "Manage"}
      isDisabled={!!busyState}
      items={items.filter((item): item is IActionsMenuItem => !!item)}
    />
  );
};
