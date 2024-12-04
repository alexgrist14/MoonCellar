import { CSSProperties, FC, useEffect, useState } from "react";
import styles from "./RangeSelector.module.scss";
import classNames from "classnames";

interface RangeSelectorProps extends Pick<HTMLInputElement, "disabled"> {
  text?: string;
  textPosition?: "above" | "left" | "right";
  variant?: "accent" | "green";
  min?: number;
  max?: number;
  step?: number;
  defaultValue?: number;
  callback?: (value: number) => void;
  finalCallback?: (value: number) => void;
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
  ...props
}) => {
  const [rangeValue, setRangeValue] = useState<string>("0");
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    !!defaultValue
      ? setRangeValue(defaultValue.toString())
      : setRangeValue("0");
  }, [defaultValue, setRangeValue]);

  const offset = (100 * +rangeValue) / (max || 100);
  const left = `calc(${offset}% - ${7.5}px)`;
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
      <div className={styles.slider}>
        <div
          className={classNames(
            styles.slider__pointer,
            styles[`slider__pointer_${variant}`],
            {
              [styles.slider__pointer_active]: isActive,
            }
          )}
          onDragEnd={() => console.log(rangeValue)}
          style={{
            left,
          }}
        ></div>
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
          className={styles.slider__input}
          type="range"
          value={rangeValue}
          onMouseOver={() => {
            setIsActive(true);
          }}
          onMouseOut={() => {
            setIsActive(false);
          }}
          onChange={(e) => {
            setRangeValue(e.target.value);
            !!callback && callback(+e.target.value);
          }}
          onMouseUp={() => !!finalCallback && finalCallback(+rangeValue)}
          onTouchEnd={() => !!finalCallback && finalCallback(+rangeValue)}
          min={min || 0}
          max={max || 100}
          step={step || 1}
          {...props}
        />
      </div>
    </div>
  );
};
