import { FC } from "react";
import { ISearchPickerOption } from "@/src/lib/shared/ui/SearchPicker";
import { SvgClose } from "@/src/lib/shared/ui/svg";
import styles from "./SelectedChips.module.scss";

interface ISelectedChipsProps {
  items: ISearchPickerOption[];
  onRemove: (id: string) => void;
  disabled?: boolean;
}

export const SelectedChips: FC<ISelectedChipsProps> = ({
  items,
  onRemove,
  disabled,
}) =>
  items.length ? (
    <ul className={styles.chips}>
      {items.map((item) => (
        <li key={item.id} className={styles.chip}>
          <span>{item.label}</span>
          <button
            type="button"
            className={styles.chip__remove}
            aria-label={`Remove ${item.label}`}
            disabled={disabled}
            onClick={() => onRemove(item.id)}
          >
            <SvgClose size="12" style={{ color: "inherit" }} />
          </button>
        </li>
      ))}
    </ul>
  ) : null;
