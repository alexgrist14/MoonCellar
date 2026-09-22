import {
  CSSProperties,
  FC,
  Fragment,
  useEffect,
  useRef,
  useState,
} from "react";
import styles from "./RangeSelector.module.scss";
import classNames from "classnames";
import { Loader } from "../Loader";
import { useMinimumLoading } from "@/src/lib/shared/hooks/useMinimumLoading";

export type IRangeValue = [number, number];

interface RangeSelectorBaseProps extends Partial<
  Pick<HTMLInputElement, "disabled">
> {
  text?: string;
  textPosition?: "above" | "left" | "right";
  variant?: "accent" | "green";
  min?: number;
  max?: number;
  step?: number;
  isLoading?: boolean;
  isWithValue?: boolean;
  formatValue?: (value: number) => string;
}

interface RangeSelectorSingleProps extends RangeSelectorBaseProps {
  isDual?: false;
  defaultValue?: number;
  callback?: (value: number) => void;
  finalCallback?: (value: number) => void;
}

interface RangeSelectorDualProps extends RangeSelectorBaseProps {
  isDual: true;
  defaultValue?: IRangeValue;
  callback?: (value: IRangeValue) => void;
  finalCallback?: (value: IRangeValue) => void;
}

type RangeSelectorProps = RangeSelectorSingleProps | RangeSelectorDualProps;

const isSameValues = (first: number[], second: number[]) =>
  first.length === second.length &&
  first.every((value, i) => value === second[i]);

const toRange = (values: number[]): IRangeValue => [
  Math.min(...values),
  Math.max(...values),
];

export const RangeSelector: FC<RangeSelectorProps> = ({
  text,
  textPosition,
  min = 0,
  max = 100,
  step = 1,
  defaultValue,
  callback,
  finalCallback,
  variant = "accent",
  isDual,
  isLoading,
  isWithValue,
  formatValue,
  ...props
}) => {
  const getDefaultValues = (): number[] =>
    isDual
      ? [
          (defaultValue as IRangeValue | undefined)?.[0] ?? min,
          (defaultValue as IRangeValue | undefined)?.[1] ?? max,
        ]
      : [(defaultValue as number | undefined) ?? min];

  const [values, setValues] = useState<number[]>(getDefaultValues);
  const [activeIndex, setActiveIndex] = useState<number>();

  const isInteracting = useRef(false);
  const emittedValues = useRef<number[]>(undefined);
  const isLoaderShown = useMinimumLoading(!!isLoading);

  useEffect(() => {
    if (isInteracting.current) return;

    const next = isDual
      ? [
          (defaultValue as IRangeValue | undefined)?.[0] ?? min,
          (defaultValue as IRangeValue | undefined)?.[1] ?? max,
        ]
      : [(defaultValue as number | undefined) ?? min];

    if (!!emittedValues.current && isSameValues(next, emittedValues.current)) {
      return;
    }

    setValues((current) => (isSameValues(current, next) ? current : next));
  }, [defaultValue, isDual, min, max]);

  const emitValues = (next: number[], isFinal?: boolean) => {
    const handler = isFinal ? finalCallback : callback;

    if (!handler) return;

    isDual
      ? (handler as (value: IRangeValue) => void)(toRange(next))
      : (handler as (value: number) => void)(next[0]);
  };

  const handleChange = (index: number, value: number) => {
    const next = values.map((current, i) => (i === index ? value : current));

    emittedValues.current = next;
    setValues(next);
    emitValues(next);
  };

  const getOffset = (value: number) => ((value - min) * 100) / (max - min || 1);

  const [from, to] = isDual ? toRange(values) : [min, values[0]];
  const thumbOffset = isWithValue
    ? "var(--range-thumb-width)"
    : "var(--range-thumb-size)";

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
        [styles.selector_labelled]: isWithValue,
        [styles.selector_disabled]: props.disabled,
      })}
      style={getStyles()}
    >
      {!!text && <span className={styles.selector__text}>{text}</span>}
      {isLoaderShown ? (
        <Loader type="moon" />
      ) : (
        <div className={styles.slider}>
          <div
            className={classNames(
              styles.slider__bar,
              styles[`slider__bar_${variant}`]
            )}
            style={{
              left: `${getOffset(from)}%`,
              width: `${getOffset(to) - getOffset(from)}%`,
            }}
          ></div>
          {values.map((value, index) => (
            <Fragment key={index}>
              <div
                className={classNames(
                  styles.slider__pointer,
                  styles[`slider__pointer_${variant}`],
                  {
                    [styles.slider__pointer_active]: activeIndex === index,
                    [styles.slider__pointer_labelled]: isWithValue,
                  }
                )}
                style={{ left: `${getOffset(value)}%` }}
              >
                {!!isWithValue && (formatValue ? formatValue(value) : value)}
              </div>
              <input
                style={{
                  left: `calc(-1 * ${thumbOffset} / 2)`,
                  width: `calc(100% + ${thumbOffset})`,
                  zIndex: index + 1,
                }}
                className={classNames(styles.slider__input, {
                  [styles.slider__input_dual]: isDual,
                  [styles.slider__input_labelled]: isDual && isWithValue,
                })}
                type="range"
                value={value}
                onMouseOver={() => setActiveIndex(index)}
                onMouseOut={() => setActiveIndex(undefined)}
                onPointerDown={() => (isInteracting.current = true)}
                onChange={(e) => handleChange(index, +e.target.value)}
                onPointerUp={() => (isInteracting.current = false)}
                onPointerCancel={() => (isInteracting.current = false)}
                onBlur={() => (isInteracting.current = false)}
                onMouseUp={() => emitValues(values, true)}
                onTouchEnd={() => emitValues(values, true)}
                min={min}
                max={max}
                step={step}
                {...props}
              />
            </Fragment>
          ))}
        </div>
      )}
    </div>
  );
};
