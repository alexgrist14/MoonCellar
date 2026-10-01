import {
  CSSProperties,
  FC,
  KeyboardEvent,
  PointerEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import cn from "classnames";
import { ITextareaProps } from "./Textarea.type";
import styles from "./Textarea.module.scss";
import { SvgResize } from "../svg";

const AUTO_MAX_SHARE = 0.4;
const MANUAL_MAX_SHARE = 0.8;
const KEYBOARD_STEP = 24;
const ICON_STYLE: CSSProperties = {
  color: "inherit",
  width: "12px",
  height: "12px",
  minWidth: "12px",
  minHeight: "12px",
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export const Textarea: FC<ITextareaProps> = ({
  className,
  error,
  classNameField,
  clearErrors,
  resize = true,
  style,
  children,
  onChange,
  onClick,
  ref,
  isDisableAutoResize,
  rows = 1,
  ...props
}) => {
  const textRef = useRef<HTMLTextAreaElement>(null);
  const mirrorRef = useRef<HTMLDivElement>(null);
  const drag = useRef({ startY: 0, startHeight: 0, frame: 0 });

  const [ownValue, setOwnValue] = useState(String(props.defaultValue ?? ""));
  const [contentHeight, setContentHeight] = useState<number>();
  const [manualHeight, setManualHeight] = useState<number>();
  const [isDragging, setIsDragging] = useState(false);

  const text = props.value !== undefined ? String(props.value) : ownValue;

  useEffect(() => {
    const mirror = mirrorRef.current;

    if (!mirror || isDisableAutoResize) return;

    const observer = new ResizeObserver(() =>
      setContentHeight(mirror.getBoundingClientRect().height)
    );

    observer.observe(mirror);

    return () => observer.disconnect();
  }, [isDisableAutoResize]);

  useEffect(() => () => cancelAnimationFrame(drag.current.frame), []);

  const autoHeight =
    contentHeight !== undefined && typeof window !== "undefined"
      ? Math.min(contentHeight, window.innerHeight * AUTO_MAX_SHARE)
      : undefined;
  const height =
    manualHeight !== undefined
      ? Math.max(manualHeight, isDisableAutoResize ? 0 : (autoHeight ?? 0))
      : isDisableAutoResize
        ? undefined
        : autoHeight;

  const setManual = (next: number) => {
    const minHeight = textRef.current
      ? parseFloat(getComputedStyle(textRef.current).minHeight) || 0
      : 0;

    setManualHeight(
      clamp(next, minHeight, window.innerHeight * MANUAL_MAX_SHARE)
    );
  };

  const handlePointerDown = (event: PointerEvent<HTMLSpanElement>) => {
    if (!textRef.current) return;

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current.startY = event.clientY;
    drag.current.startHeight = textRef.current.offsetHeight;
    setIsDragging(true);
  };

  const handlePointerMove = (event: PointerEvent<HTMLSpanElement>) => {
    if (!isDragging) return;

    const next = drag.current.startHeight + event.clientY - drag.current.startY;

    cancelAnimationFrame(drag.current.frame);
    drag.current.frame = requestAnimationFrame(() => setManual(next));
  };

  const handlePointerUp = () => setIsDragging(false);

  const handleKeyDown = (event: KeyboardEvent<HTMLSpanElement>) => {
    const current = textRef.current?.offsetHeight ?? 0;

    if (event.key === "ArrowDown") setManual(current + KEYBOARD_STEP);
    else if (event.key === "ArrowUp") setManual(current - KEYBOARD_STEP);
    else if (event.key === "Escape") setManualHeight(undefined);
    else return;

    event.preventDefault();
  };

  return (
    <div
      className={cn(styles.textarea, className)}
      style={{ "--textarea-rows": rows } as CSSProperties}
    >
      <textarea
        className={cn(classNameField, styles.textarea__field, {
          [styles.textarea__field_error]: !!error?.message,
          [styles.textarea__field_dragging]: isDragging,
          [styles.textarea__field_sized]: height !== undefined,
          [styles.textarea__field_withHandle]: resize,
        })}
        rows={rows}
        style={{
          ...style,
          ...(height !== undefined && { height: `${Math.round(height)}px` }),
        }}
        ref={(node) => {
          textRef.current = node;

          if (typeof ref === "function") {
            ref(node);
          } else if (ref) {
            ref.current = node;
          }
        }}
        onClick={(event) => {
          if (clearErrors && props.name) clearErrors(props.name);
          onClick?.(event);
        }}
        onChange={(event) => {
          setOwnValue(event.target.value);
          onChange?.(event);
        }}
        {...props}
      />
      {!isDisableAutoResize && (
        <div
          ref={mirrorRef}
          className={cn(classNameField, styles.textarea__mirror)}
          style={style}
          aria-hidden="true"
        >
          {`${text} `}
        </div>
      )}
      {resize && (
        <span
          className={cn(styles.textarea__handle, {
            [styles.textarea__handle_active]: isDragging,
          })}
          role="separator"
          aria-orientation="horizontal"
          aria-label="Resize the field"
          tabIndex={0}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onDoubleClick={() => setManualHeight(undefined)}
          onKeyDown={handleKeyDown}
        >
          <SvgResize className={styles.textarea__icon} style={ICON_STYLE} />
        </span>
      )}
      {children}
      {error?.message && (
        <span className={styles.textarea__error}>{error.message}</span>
      )}
    </div>
  );
};
