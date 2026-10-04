"use client";

import {
  ChangeEvent,
  FC,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import classNames from "classnames";
import styles from "./DatePicker.module.scss";
import { SvgCalendar, SvgChevron, SvgInfo } from "../svg";
import { Tooltip } from "../Tooltip";
import { Button, ButtonColor } from "../Button";
import { commonUtils } from "@/src/lib/shared/utils/common.utils";
import { useCloseEvents } from "@/src/lib/shared/hooks/useCloseEvents";

interface IDatePickerProps {
  value?: string;
  placeholder?: string;
  ariaLabel?: string;
  className?: string;
  isDisabled?: boolean;
  onChange: (value: string) => void;
}

const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const CELLS_COUNT = 42;
const OFFSET = 8;
const OFFSET_FALLBACK_WIDTH = 300;

const toIso = (date: Date) => commonUtils.formatDate(date, { isISO: true });

const TYPED_LENGTH = 8;

const toDigits = (text: string) =>
  text.replace(/\D/g, "").slice(0, TYPED_LENGTH);

const maskDigits = (digits: string) =>
  [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4)]
    .filter(Boolean)
    .join(".");

const getTypedError = (digits: string) => {
  if (digits.length !== TYPED_LENGTH || parseTyped(digits)) return undefined;

  const day = Number(digits.slice(0, 2));
  const month = Number(digits.slice(2, 4));
  const year = Number(digits.slice(4));

  if (year < 1000) return "Enter the year with four digits.";
  if (month < 1 || month > 12) return "The month must be from 01 to 12.";

  const monthName = new Date(year, month - 1, 1).toLocaleString("en-US", {
    month: "long",
  });
  const daysInMonth = new Date(year, month, 0).getDate();

  return day < 1
    ? "The day cannot be 00."
    : `${monthName} ${year} has ${daysInMonth} days.`;
};

const parseTyped = (digits: string) => {
  if (digits.length !== TYPED_LENGTH) return undefined;

  const day = Number(digits.slice(0, 2));
  const month = Number(digits.slice(2, 4));
  const year = Number(digits.slice(4));
  const date = new Date(year, month - 1, day);

  return date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
    ? date
    : undefined;
};

const parseValue = (value?: string) => {
  if (!value) return undefined;

  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  const parsed =
    !!year && !!month && !!day
      ? new Date(year, month - 1, day)
      : new Date(value);

  return isNaN(parsed.getTime()) ? undefined : parsed;
};

export const DatePicker: FC<IDatePickerProps> = ({
  value,
  placeholder = "DD.MM.YYYY",
  ariaLabel = "Date",
  className,
  isDisabled,
  onChange,
}) => {
  const selected = useMemo(() => parseValue(value), [value]);
  const formatted = selected ? commonUtils.formatDate(selected) : "";

  const [text, setText] = useState(formatted);

  useEffect(() => setText(formatted), [formatted]);

  const typedDigits = toDigits(text);
  const typedError = getTypedError(typedDigits);
  const isInvalid = !!typedError;

  const handleInput = (event: ChangeEvent<HTMLInputElement>) => {
    const digits = toDigits(event.target.value);
    const typed = parseTyped(digits);

    setText(maskDigits(digits));

    if (!digits) onChange("");
    if (typed) onChange(toIso(typed));
  };

  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => selected ?? new Date());
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(
    null
  );

  const fieldRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useCloseEvents(
    [fieldRef, popoverRef],
    useCallback(() => setIsOpen(false), [])
  );

  const connector = commonUtils.checkWindow(
    () => document.getElementById("dropdown-connector") ?? document.body
  );

  useEffect(() => {
    if (!isOpen) return;

    setViewDate(selected ?? new Date());

    const updateCoords = () => {
      const rect = fieldRef.current?.getBoundingClientRect();

      if (!rect) return;

      const popover = popoverRef.current?.getBoundingClientRect();
      const width = popover?.width ?? OFFSET_FALLBACK_WIDTH;
      const height = popover?.height ?? 0;
      const isFlipped =
        rect.bottom + OFFSET + height > window.innerHeight &&
        rect.top - OFFSET - height > 0;

      setCoords({
        top: Math.max(
          OFFSET,
          isFlipped ? rect.top - OFFSET - height : rect.bottom + OFFSET
        ),
        left: Math.max(
          OFFSET,
          Math.min(rect.left, window.innerWidth - width - OFFSET)
        ),
      });
    };

    updateCoords();

    const frame = requestAnimationFrame(updateCoords);

    window.addEventListener("scroll", updateCoords, true);
    window.addEventListener("resize", updateCoords);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", updateCoords, true);
      window.removeEventListener("resize", updateCoords);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const days = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const start = new Date(year, month, 1 - ((firstDay.getDay() + 6) % 7));
    const today = toIso(new Date());

    return Array.from({ length: CELLS_COUNT }, (_, index) => {
      const date = new Date(
        start.getFullYear(),
        start.getMonth(),
        start.getDate() + index
      );
      const iso = toIso(date);

      return {
        iso,
        label: date.getDate(),
        isCurrentMonth: date.getMonth() === month,
        isSelected: !!value && iso === value,
        isToday: iso === today,
      };
    });
  }, [viewDate, value]);

  const shiftMonth = (step: number) =>
    setViewDate(
      (current) => new Date(current.getFullYear(), current.getMonth() + step, 1)
    );

  const selectDate = (iso: string) => {
    onChange(iso);
    setIsOpen(false);
  };

  return (
    <div className={classNames(styles.picker, className)}>
      <div
        ref={fieldRef}
        className={classNames(styles.picker__field, {
          [styles.picker__field_active]: isOpen,
          [styles.picker__field_invalid]: isInvalid,
          [styles.picker__field_disabled]: isDisabled,
        })}
      >
        <input
          className={styles.picker__input}
          value={text}
          placeholder={placeholder}
          aria-label={ariaLabel}
          aria-invalid={isInvalid}
          inputMode="numeric"
          autoComplete="off"
          disabled={isDisabled}
          onChange={handleInput}
          onBlur={() => !isInvalid && setText(formatted)}
        />
        {!!typedError && (
          <Tooltip content={typedError}>
            <span
              role="img"
              aria-label={typedError}
              tabIndex={0}
              className={styles.picker__error}
            >
              <SvgInfo size="20" color="negative" />
            </span>
          </Tooltip>
        )}
        <button
          type="button"
          className={styles.picker__toggle}
          aria-label="Open calendar"
          aria-expanded={isOpen}
          disabled={isDisabled}
          onClick={() => setIsOpen((current) => !current)}
        >
          <SvgCalendar size="20" color="secondary" />
        </button>
      </div>

      {isOpen &&
        !!coords &&
        !!connector &&
        createPortal(
          <div
            ref={popoverRef}
            className={styles.picker__popover}
            style={{ top: coords.top, left: coords.left }}
          >
            <div className={styles.picker__head}>
              <p>
                {viewDate.toLocaleString("en-US", { month: "long" })}{" "}
                {viewDate.getFullYear()}
              </p>
              <div className={styles.picker__arrows}>
                <Button
                  type="button"
                  aria-label="Previous month"
                  compact
                  isOnlyIcon
                  onClick={() => shiftMonth(-1)}
                >
                  <SvgChevron
                    size="16"
                    style={{ transform: "rotate(90deg)" }}
                  />
                </Button>
                <Button
                  type="button"
                  aria-label="Next month"
                  compact
                  isOnlyIcon
                  onClick={() => shiftMonth(1)}
                >
                  <SvgChevron
                    size="16"
                    style={{ transform: "rotate(-90deg)" }}
                  />
                </Button>
              </div>
            </div>

            <div className={styles.picker__grid}>
              {WEEKDAYS.map((day) => (
                <p key={day} className={styles.picker__weekday}>
                  {day}
                </p>
              ))}
            </div>

            <div className={styles.picker__grid}>
              {days.map((day) => (
                <button
                  key={day.iso}
                  type="button"
                  className={classNames(styles.picker__day, {
                    [styles.picker__day_muted]: !day.isCurrentMonth,
                    [styles.picker__day_today]: day.isToday && !day.isSelected,
                    [styles.picker__day_selected]: day.isSelected,
                  })}
                  onClick={() => selectDate(day.iso)}
                >
                  {day.label}
                </button>
              ))}
            </div>

            <div className={styles.picker__controls}>
              <Button
                type="button"
                color={ButtonColor.TRANSPARENT}
                compact
                className={styles.picker__control}
                onClick={() => {
                  onChange("");
                  setIsOpen(false);
                }}
              >
                Clear
              </Button>
              <Button
                type="button"
                color={ButtonColor.TRANSPARENT}
                compact
                className={styles.picker__control_accent}
                onClick={() => selectDate(toIso(new Date()))}
              >
                Today
              </Button>
            </div>
          </div>,
          connector
        )}
    </div>
  );
};
