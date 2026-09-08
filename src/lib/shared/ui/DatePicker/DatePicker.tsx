"use client";

import { FC, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import classNames from "classnames";
import styles from "./DatePicker.module.scss";
import { SvgCalendar, SvgChevron } from "../svg";
import { commonUtils } from "../../utils/common.utils";
import useCloseEvents from "../../hooks/useCloseEvents";

interface IDatePickerProps {
  value?: string;
  placeholder?: string;
  className?: string;
  isDisabled?: boolean;
  onChange: (value: string) => void;
}

const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const CELLS_COUNT = 42;
const OFFSET = 8;
const OFFSET_FALLBACK_WIDTH = 300;

const toIso = (date: Date) => commonUtils.formatDate(date, { isISO: true });

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
  placeholder = "Date",
  className,
  isDisabled,
  onChange,
}) => {
  const selected = useMemo(() => parseValue(value), [value]);

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
        role="button"
        aria-label={placeholder}
        className={classNames(styles.picker__field, {
          [styles.picker__field_active]: isOpen,
          [styles.picker__field_disabled]: isDisabled,
        })}
        onClick={() => !isDisabled && setIsOpen((current) => !current)}
      >
        <span
          className={classNames(styles.picker__value, {
            [styles.picker__value_empty]: !selected,
          })}
        >
          {selected ? commonUtils.formatDate(selected) : placeholder}
        </span>
        <SvgCalendar size="20" color="secondary" />
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
                <button
                  type="button"
                  aria-label="Previous month"
                  className={styles.picker__arrow}
                  onClick={() => shiftMonth(-1)}
                >
                  <SvgChevron
                    size="16"
                    style={{ transform: "rotate(90deg)" }}
                  />
                </button>
                <button
                  type="button"
                  aria-label="Next month"
                  className={styles.picker__arrow}
                  onClick={() => shiftMonth(1)}
                >
                  <SvgChevron
                    size="16"
                    style={{ transform: "rotate(-90deg)" }}
                  />
                </button>
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
              <button
                type="button"
                className={styles.picker__control}
                onClick={() => {
                  onChange("");
                  setIsOpen(false);
                }}
              >
                Clear
              </button>
              <button
                type="button"
                className={classNames(
                  styles.picker__control,
                  styles.picker__control_accent
                )}
                onClick={() => selectDate(toIso(new Date()))}
              >
                Today
              </button>
            </div>
          </div>,
          connector
        )}
    </div>
  );
};
