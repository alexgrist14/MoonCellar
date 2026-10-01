import { KeyboardEvent, ReactNode, useRef } from "react";
import classNames from "classnames";
import styles from "./ChoiceCards.module.scss";

export type IChoiceCardTone = "accent" | "attention";

export interface IChoiceCardOption<T> {
  value: T;
  title: ReactNode;
  text?: ReactNode;
  icon?: ReactNode;
  meta?: ReactNode;
  tone?: IChoiceCardTone;
  isDisabled?: boolean;
}

interface IChoiceCardsProps<T> {
  options: IChoiceCardOption<T>[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
  isDisabled?: boolean;
  className?: string;
}

const KEY_STEPS: Record<string, number> = {
  ArrowDown: 1,
  ArrowRight: 1,
  ArrowUp: -1,
  ArrowLeft: -1,
};

export const ChoiceCards = <T,>({
  options,
  value,
  onChange,
  ariaLabel,
  isDisabled,
  className,
}: IChoiceCardsProps<T>) => {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const isEnabled = (option?: IChoiceCardOption<T>) =>
    !!option && !isDisabled && !option.isDisabled;
  const checkedIndex = options.findIndex((option) => option.value === value);
  const focusIndex =
    checkedIndex >= 0 && isEnabled(options[checkedIndex])
      ? checkedIndex
      : options.findIndex(isEnabled);
  const hasMeta = options.some((option) => !!option.meta);

  const select = (index: number) => {
    refs.current[index]?.focus();
    onChange(options[index].value);
  };

  const handleKeyDown = (event: KeyboardEvent, index: number) => {
    const step = KEY_STEPS[event.key];
    const enabled = options
      .map((option, i) => (isEnabled(option) ? i : -1))
      .filter((i) => i >= 0);

    if (!enabled.length) return;

    if (step) {
      event.preventDefault();
      const position = enabled.indexOf(index);
      select(enabled[(position + step + enabled.length) % enabled.length]);
    } else if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      select(event.key === "Home" ? enabled[0] : enabled[enabled.length - 1]);
    }
  };

  return (
    <div
      className={classNames(styles.cards, className)}
      role="radiogroup"
      aria-label={ariaLabel}
      aria-disabled={isDisabled || undefined}
    >
      {options.map((option, index) => {
        const isChecked = index === checkedIndex;

        return (
          <button
            key={String(option.value)}
            ref={(node) => {
              refs.current[index] = node;
            }}
            type="button"
            role="radio"
            aria-checked={isChecked}
            tabIndex={index === focusIndex ? 0 : -1}
            disabled={!isEnabled(option)}
            className={classNames(
              styles.card,
              styles[`card_${option.tone ?? "accent"}`]
            )}
            onClick={() => !isChecked && onChange(option.value)}
            onKeyDown={(event) => handleKeyDown(event, index)}
          >
            {!!option.icon && (
              <span className={styles.card__icon}>{option.icon}</span>
            )}
            <span className={styles.card__body}>
              <span className={styles.card__title}>{option.title}</span>
              {!!option.text && (
                <span className={styles.card__text}>{option.text}</span>
              )}
              {hasMeta && (
                <span
                  className={styles.card__meta}
                  aria-hidden={!option.meta || undefined}
                >
                  {option.meta || " "}
                </span>
              )}
            </span>
            <span className={styles.card__radio} aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );
};
