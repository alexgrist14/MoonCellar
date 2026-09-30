import { FC, useRef, useState } from "react";
import cn from "classnames";
import { IMAGE_PROMPT_MAX_LENGTH } from "@mooncellar/schemas";
import { Button, ButtonColor } from "@/src/lib/shared/ui/Button";
import { Popover } from "@/src/lib/shared/ui/Popover";
import { Textarea } from "@/src/lib/shared/ui/Textarea";
import styles from "./ImageGenerator.module.scss";

type IBusyState = "generating" | "saving" | "deleting";

interface IRowActionsProps {
  prompt: string;
  busyState?: IBusyState;
  isSaved: boolean;
  isElement: boolean;
  hasUnsavedSet: boolean;
  onUploadSet: () => void;
  onUpload: () => void;
  onRegenerate: (prompt: string) => void;
  onElements: () => void;
  onDelete: () => void;
}

const BUSY_LABELS: Record<IBusyState, string> = {
  generating: "Generating…",
  saving: "Uploading…",
  deleting: "Deleting…",
};

export const RowActions: FC<IRowActionsProps> = ({
  prompt,
  busyState,
  isSaved,
  isElement,
  hasUnsavedSet,
  onUploadSet,
  onUpload,
  onRegenerate,
  onElements,
  onDelete,
}) => {
  const anchorRef = useRef<HTMLButtonElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [value, setValue] = useState(prompt);

  const close = () => {
    setIsOpen(false);
    setIsRegenerating(false);
  };

  const run = (action: () => void) => () => {
    close();
    action();
  };

  const submit = () => {
    if (!value.trim()) return;

    close();
    onRegenerate(value.trim());
  };

  return (
    <>
      <Button
        ref={anchorRef}
        color={ButtonColor.DEFAULT}
        disabled={!!busyState}
        onClick={() => {
          setValue(prompt);
          setIsRegenerating(false);
          setIsOpen((current) => !current);
        }}
      >
        {busyState ? BUSY_LABELS[busyState] : "Manage"}
      </Button>
      <Popover
        anchorRef={anchorRef}
        isOpen={isOpen}
        onClose={close}
        align="end"
        title={isRegenerating ? "Regenerate" : undefined}
        width={isRegenerating ? "360px" : "220px"}
        contentStyle={{ padding: "var(--padding-x2)" }}
      >
        {isRegenerating ? (
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
              <Button
                color={ButtonColor.DEFAULT}
                onClick={() => setIsRegenerating(false)}
              >
                Back
              </Button>
              <Button
                color={ButtonColor.ACCENT}
                disabled={!value.trim()}
                onClick={submit}
              >
                Generate
              </Button>
            </div>
          </div>
        ) : (
          <div className={styles.menu} role="menu">
            {hasUnsavedSet && (
              <button
                type="button"
                role="menuitem"
                className={styles.menu__item}
                onClick={run(onUploadSet)}
              >
                Upload set to S3
              </button>
            )}
            {!isSaved && (
              <button
                type="button"
                role="menuitem"
                className={styles.menu__item}
                onClick={run(onUpload)}
              >
                Upload to S3
              </button>
            )}
            <button
              type="button"
              role="menuitem"
              className={styles.menu__item}
              onClick={() => setIsRegenerating(true)}
            >
              Regenerate…
            </button>
            {!isElement && (
              <button
                type="button"
                role="menuitem"
                className={styles.menu__item}
                onClick={run(onElements)}
              >
                Split into elements…
              </button>
            )}
            <button
              type="button"
              role="menuitem"
              className={cn(styles.menu__item, styles.menu__item_danger)}
              onClick={run(onDelete)}
            >
              Delete
            </button>
          </div>
        )}
      </Popover>
    </>
  );
};
