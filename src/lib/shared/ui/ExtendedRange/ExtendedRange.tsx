import styles from "./ExtendedRange.module.scss";
import { FC, useEffect, useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import { RangeSelector } from "../RangeSelector";

export interface IExtendedCheckboxProps {
  title?: string;
  selected: number;
  setSelected: any;
  isDisabled?: boolean;
  min: number;
  max: number;
  symbol?: string;
  text?: string;
  step?: number;
}

export const ExtendedRange: FC<IExtendedCheckboxProps> = ({
  title,
  selected,
  setSelected,
  isDisabled,
  max,
  min,
  symbol,
  text,
  step,
}) => {
  const [value, setValue] = useState(0);

  const debouncedSetSelected = useDebouncedCallback(
    (value: number) => setSelected(value),
    500
  );

  useEffect(() => {
    setValue(selected);
  }, [selected]);

  return (
    <div className={styles.range}>
      {!!title && <h4>{title}</h4>}
      <div className={styles.range__wrapper}>
        <RangeSelector
          variant="green"
          text={value !== min ? (symbol || "From ") + value : text || "All"}
          defaultValue={value}
          min={min}
          max={max}
          step={step}
          callback={(value) => {
            setValue(value);
            debouncedSetSelected(value);
          }}
          disabled={isDisabled || false}
        />
      </div>
    </div>
  );
};
