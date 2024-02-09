import { ActionCreatorWithPayload } from "@reduxjs/toolkit";
import styles from "./ExtendedRange.module.scss";
import Range from "@atlaskit/range";
import { FC, useEffect, useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import { useAppDispatch } from "../../store";

export interface IExtendedCheckboxProps {
  title: string;
  selected: number;
  setSelected: ActionCreatorWithPayload<number>;
  isDisabled?: boolean;
  min: number;
  max: number;
  allType: "max" | "min";
}

export const ExtendedRange: FC<IExtendedCheckboxProps> = ({
  title,
  selected,
  setSelected,
  isDisabled,
  max,
  min,
  allType,
}) => {
  const dispatch = useAppDispatch();
  const [value, setValue] = useState(0);

  const debouncedSetSelected = useDebouncedCallback((value: number) =>
    dispatch(setSelected(value))
  );

  useEffect(() => {
    setValue(selected);
  }, [selected]);

  return (
    <div className={styles.range}>
      <h3>{title}</h3>
      <div className={styles.range__wrapper}>
        <Range
          value={value}
          min={min}
          max={max}
          type="range"
          onChange={(value) => {
            setValue(value);
            debouncedSetSelected(value);
          }}
          isDisabled={isDisabled}
        />
        {allType === "max" && (
          <span>{value !== max ? "<= " + value : "All"}</span>
        )}
        {allType === "min" && (
          <span>{value !== min ? ">= " + value : "All"}</span>
        )}
      </div>
    </div>
  );
};
