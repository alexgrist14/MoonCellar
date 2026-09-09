import { CSSProperties, FC, useEffect, useRef, useState } from "react";
import styles from "./RangeSelector.module.scss";
import classNames from "classnames";
import { Loader } from "../Loader";

interface RangeSelectorProps extends Partial<
  Pick<HTMLInputElement, "disabled">
> {
  text?: string;
  textPosition?: "above" | "left" | "right";
  variant?: "accent" | "green";
  min?: number;
  max?: number;
  step?: number;
  defaultValue?: number;
  callback?: (value: number) => void;
  finalCallback?: (value: number) => void;
  isLoading?: boolean;
  isWithValue?: boolean;
  formatValue?: (value: number) => string;
}

export const RangeSelector: FC<RangeSelectorProps> = ({
  text,
  textPosition,
  min,
  max,
  step,
  defaultValue,
  callback,
  finalCallback,
  variant = "accent",
  isLoading,
  isWithValue,
  formatValue,
  ...props
}) => {
  const [rangeValue, setRangeValue] = useState<string>("0");
  const [isActive, setIsActive] = useState(false);

  const isInteracting = useRef(false);
  const emittedValue = useRef<number>(undefined);

  useEffect(() => {
    if (isInteracting.current || defaultValue === emittedValue.current) return;

    setRangeValue(!!defaultValue ? defaultValue.toString() : "0");
  }, [defaultValue, setRangeValue]);

  const offset = (100 * +rangeValue) / (max || 100);
  const thumbOffset = isWithValue
    ? "var(--range-thumb-width)"
    : "var(--range-thumb-size)";
  const left = `${offset}%`;
  const width = `${offset}%`;

  const getStyles = (): CSSProperties => {
    if (textPosition === "left") {
      return {
        gridTemplateColumns: "15% 1fr",
        gridTemplateAreas: "'text slider'",
      };
    }
    if (textPosition === "right") {
      return {
        gridTemplateColumns: "1fr 15%",
        gridTemplateAreas: "'slider text'",
      };
    }

    return { gridTemplateAreas: "'text' 'slider'" };
  };

  return (
    <div
      className={classNames(styles.selector, {
        [styles.selector_disabled]: props.disabled,
      })}
      style={getStyles()}
    >
      {!!text && <span className={styles.selector__text}>{text}</span>}
      {isLoading ? (
        <Loader type="moon" />
      ) : (
        <div className={styles.slider}>
          <div
            className={classNames(
              styles.slider__pointer,
              styles[`slider__pointer_${variant}`],
              {
                [styles.slider__pointer_active]: isActive,
                [styles.slider__pointer_labelled]: isWithValue,
              }
            )}
            style={{
              left,
            }}
          >
            {!!isWithValue &&
              (formatValue ? formatValue(+rangeValue) : rangeValue)}
          </div>
          <div
            className={classNames(
              styles.slider__bar,
              styles[`slider__bar_${variant}`]
            )}
            style={{
              width,
            }}
          ></div>
          <input
            style={{
              left: `calc(-1 * ${thumbOffset} / 2)`,
              width: `calc(100% + ${thumbOffset})`,
            }}
            className={styles.slider__input}
            type="range"
            value={rangeValue}
            onMouseOver={() => {
              setIsActive(true);
            }}
            onMouseOut={() => {
              setIsActive(false);
            }}
            onPointerDown={() => (isInteracting.current = true)}
            onChange={(e) => {
              emittedValue.current = +e.target.value;
              setRangeValue(e.target.value);
              !!callback && callback(+e.target.value);
            }}
            onPointerUp={() => (isInteracting.current = false)}
            onPointerCancel={() => (isInteracting.current = false)}
            onBlur={() => (isInteracting.current = false)}
            onMouseUp={() => !!finalCallback && finalCallback(+rangeValue)}
            onTouchEnd={() => !!finalCallback && finalCallback(+rangeValue)}
            min={min || 0}
            max={max || 100}
            step={step || 1}
            {...props}
          />
        </div>
      )}
    </div>
  );
};
