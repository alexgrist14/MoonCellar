import { FC, useEffect, useState } from "react";
import {
  IImageElement,
  IMAGE_ELEMENTS_MAX,
  IMAGE_PROMPT_MAX_LENGTH,
} from "@mooncellar/schemas";
import { useSuggestImageElementsMutation } from "@/src/lib/entities/generated-image/api";
import { IGeneratedImageEntry } from "@/src/lib/entities/generated-image/model";
import { Box } from "@/src/lib/shared/ui/Box";
import { Button, ButtonColor } from "@/src/lib/shared/ui/Button";
import { Checkbox } from "@/src/lib/shared/ui/Checkbox";
import { Input } from "@/src/lib/shared/ui/Input";
import { Loader } from "@/src/lib/shared/ui/Loader";
import { Textarea } from "@/src/lib/shared/ui/Textarea";
import styles from "./ImageGenerator.module.scss";

interface IElementsModalProps {
  entry: IGeneratedImageEntry;
  onGenerate: (elements: IImageElement[]) => void;
  onClose: () => void;
}

type IElementRow = IImageElement & { key: number; isChecked: boolean };

let nextKey = 0;

const toRow = (element: IImageElement): IElementRow => ({
  ...element,
  key: nextKey++,
  isChecked: true,
});

export const ElementsModal: FC<IElementsModalProps> = ({
  entry,
  onGenerate,
  onClose,
}) => {
  const [rows, setRows] = useState<IElementRow[]>([]);
  const { mutate, isPending, isError } = useSuggestImageElementsMutation();

  useEffect(() => {
    mutate(
      { prompt: entry.prompt, dataUrl: entry.dataUrl },
      { onSuccess: ({ elements }) => setRows(elements.map(toRow)) }
    );
  }, [entry.dataUrl, entry.prompt, mutate]);

  const updateRow = (key: number, patch: Partial<IElementRow>) =>
    setRows((current) =>
      current.map((row) => (row.key === key ? { ...row, ...patch } : row))
    );

  const selected = rows.filter(
    (row) => row.isChecked && row.name.trim() && row.prompt.trim()
  );

  return (
    <Box
      title="Split into elements"
      isTitleStart
      onClose={onClose}
      isWithScrollBar
      wrapperStyle={{ width: "var(--image-generator-elements-width)" }}
      contentStyle={{ padding: "var(--padding-x5)" }}
    >
      <div className={styles.elements}>
        <p className={styles.elements__hint}>
          Each element is generated from this image, so it keeps its shapes and
          colours. Untick what you do not need, edit the prompts or add your
          own.
        </p>

        {isPending && (
          <div className={styles.elements__loading}>
            <Loader minHeight="var(--padding-x8)" />
            <span>Looking at the image…</span>
          </div>
        )}

        {isError && !rows.length && (
          <p className={styles.elements__hint}>
            The image could not be split automatically. Add the elements
            yourself.
          </p>
        )}

        {rows.map((row) => (
          <div key={row.key} className={styles.elements__row}>
            <Checkbox
              checked={row.isChecked}
              aria-label={`Generate ${row.name || "this element"}`}
              onChange={() => updateRow(row.key, { isChecked: !row.isChecked })}
            />
            <div className={styles.elements__fields}>
              <Input
                value={row.name}
                placeholder="Element name"
                onChange={(event) =>
                  updateRow(row.key, { name: event.target.value })
                }
              />
              <Textarea
                value={row.prompt}
                rows={2}
                placeholder="What to isolate from the image"
                onChange={(event) =>
                  updateRow(row.key, {
                    prompt: event.target.value.slice(
                      0,
                      IMAGE_PROMPT_MAX_LENGTH
                    ),
                  })
                }
              />
            </div>
          </div>
        ))}

        {!isPending && rows.length < IMAGE_ELEMENTS_MAX && (
          <Button
            color={ButtonColor.DEFAULT}
            onClick={() =>
              setRows((current) => [
                ...current,
                toRow({ name: "", prompt: "" }),
              ])
            }
          >
            Add element
          </Button>
        )}

        <div className={styles.elements__actions}>
          <Button color={ButtonColor.DEFAULT} onClick={onClose}>
            Cancel
          </Button>
          <Button
            color={ButtonColor.ACCENT}
            disabled={!selected.length}
            onClick={() => {
              onGenerate(
                selected.map(({ name, prompt }) => ({
                  name: name.trim(),
                  prompt: prompt.trim(),
                }))
              );
              onClose();
            }}
          >
            {selected.length
              ? `Generate ${selected.length} ${selected.length === 1 ? "element" : "elements"}`
              : "Generate"}
          </Button>
        </div>
      </div>
    </Box>
  );
};
