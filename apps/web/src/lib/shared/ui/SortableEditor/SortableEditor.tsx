"use client";

import { ReactNode } from "react";
import classNames from "classnames";
import { Button, ButtonColor } from "@/src/lib/shared/ui/Button";
import {
  ISortableGridProps,
  SortableGrid,
} from "@/src/lib/shared/ui/SortableGrid";
import styles from "./SortableEditor.module.scss";

interface ISortableEditorProps<T> extends ISortableGridProps<T> {
  onCancel: () => void;
  onSave: () => void;
  isBusy?: boolean;
  note?: ReactNode;
  cancelLabel?: string;
  saveLabel?: string;
  wrapperClassName?: string;
}

export const SortableEditor = <T,>({
  onCancel,
  onSave,
  isBusy,
  note = "Drag or use the arrows to reorder.",
  cancelLabel = "Cancel",
  saveLabel = "Save",
  wrapperClassName,
  isDisabled,
  ...gridProps
}: ISortableEditorProps<T>) => (
  <div className={classNames(styles.editor, wrapperClassName)}>
    <SortableGrid {...gridProps} isDisabled={isDisabled || isBusy} />
    <div className={styles.footer}>
      {note && <p className={styles.footer__note}>{note}</p>}
      <div className={styles.footer__actions}>
        <Button
          type="button"
          color={ButtonColor.DEFAULT}
          disabled={isBusy}
          onClick={onCancel}
        >
          {cancelLabel}
        </Button>
        <Button
          type="button"
          color={ButtonColor.ACCENT}
          disabled={isBusy}
          onClick={onSave}
        >
          {saveLabel}
        </Button>
      </div>
    </div>
  </div>
);
