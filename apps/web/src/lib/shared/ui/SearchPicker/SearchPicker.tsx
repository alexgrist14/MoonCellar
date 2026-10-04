import { FC, useRef, useState } from "react";
import Image from "next/image";
import { Input } from "@/src/lib/shared/ui/Input";
import { Popover } from "@/src/lib/shared/ui/Popover";
import styles from "./SearchPicker.module.scss";

const RESULTS_RESERVED_HEIGHT = 440;

export interface ISearchPickerOption {
  id: string;
  label: string;
  meta?: string;
  image?: string | null;
  slug?: string;
}

interface ISearchPickerProps {
  label: string;
  placeholder?: string;
  search: string;
  onSearch: (value: string) => void;
  options: ISearchPickerOption[];
  onPick: (option: ISearchPickerOption) => void;
  isLoading?: boolean;
  disabled?: boolean;
  minLength?: number;
}

export const SearchPicker: FC<ISearchPickerProps> = ({
  label,
  placeholder,
  search,
  onSearch,
  options,
  onPick,
  isLoading,
  disabled,
  minLength = 2,
}) => {
  const fieldRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(true);
  const isActive = search.trim().length >= minLength;

  const list = (
    <ul className={styles.picker__list} aria-label={`${label} results`}>
      {!options.length && (
        <li className={styles.picker__empty}>
          {isLoading ? "Searching…" : "Nothing found"}
        </li>
      )}
      {options.map((option) => (
        <li key={option.id}>
          <button
            type="button"
            className={styles.picker__option}
            disabled={disabled}
            onClick={() => onPick(option)}
          >
            <span className={styles.picker__thumb}>
              {!!option.image && (
                <Image src={option.image} alt="" fill sizes="32px" />
              )}
            </span>
            <span className={styles.picker__text}>
              <span className={styles.picker__name}>{option.label}</span>
              {!!option.meta && (
                <span className={styles.picker__meta}>{option.meta}</span>
              )}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );

  return (
    <div className={styles.picker}>
      <span className={styles.picker__label}>{label}</span>
      <div ref={fieldRef} onFocus={() => setIsOpen(true)}>
        <Input
          value={search}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
          onChange={(event) => {
            setIsOpen(true);
            onSearch(event.target.value);
          }}
        />
      </div>
      <Popover
        anchorRef={fieldRef}
        isOpen={isActive && isOpen}
        onClose={() => setIsOpen(false)}
        matchAnchorWidth
        isSheetDisabled
        reservedHeight={RESULTS_RESERVED_HEIGHT}
        contentStyle={{ padding: 0 }}
      >
        {list}
      </Popover>
    </div>
  );
};
