import { ActionCreatorWithPayload } from "@reduxjs/toolkit";
import styles from "./ExtendedRange.module.scss";
import { FC, useEffect, useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import { useAppDispatch } from "@/src/lib/app/store";
import { RangeSelector } from "../RangeSelector";

export interface IExtendedCheckboxProps {
  title: string;
  selected: number;
  setSelected: ActionCreatorWithPayload<number>;
  isDisabled?: boolean;
  min: number;
  max: number;
  symbol?: string;
}

export const ExtendedRange: FC<IExtendedCheckboxProps> = ({
  title,
  selected,
  setSelected,
  isDisabled,
  max,
  min,
  symbol,
}) => {
  const dispatch = useAppDispatch();
  const [value, setValue] = useState(0);

  const debouncedSetSelected = useDebouncedCallback(
    (value: number) => dispatch(setSelected(value)),
    500
  );

  useEffect(() => {
    setValue(selected);
  }, [selected]);

  return (
    <div className={styles.range}>
      <h3>{title}</h3>
      <div className={styles.range__wrapper}>
        <RangeSelector
          text={value !== min ? (symbol || "From ") + value : "All"}
          defaultValue={value}
          min={min}
          max={max}
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
