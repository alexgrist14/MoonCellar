import styles from "./Tooltip.module.scss";
import classNames from "classnames";
import { createPortal } from "react-dom";
import {
  cloneElement,
  isValidElement,
  ReactElement,
  ReactNode,
  Ref,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

export type ITooltipPosition = "top" | "bottom" | "left" | "right";
export type ITooltipAlign = "start" | "center" | "end";

interface ITooltipProps {
  children: ReactElement;
  content: ReactNode;
  position?: ITooltipPosition;
  align?: ITooltipAlign;
  className?: string;
  isDisabled?: boolean;
  root?: HTMLElement | null;
}

const GAP = 8;
const VIEWPORT_PADDING = 8;

const mergeRefs =
  <T,>(...refs: (Ref<T> | undefined)[]) =>
  (node: T | null) => {
    refs.forEach((ref) => {
      if (typeof ref === "function") ref(node);
      else if (ref && "current" in ref)
        (ref as { current: T | null }).current = node;
    });
  };

export const Tooltip = ({
  children,
  content,
  position = "top",
  align = "center",
  className,
  isDisabled,
  root,
}: ITooltipProps) => {
  const [triggerEl, setTriggerEl] = useState<HTMLElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(
    null
  );

  useLayoutEffect(() => {
    if (!triggerEl) return;

    const hide = () => setIsVisible(false);

    const handlePointerEnter = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;

      setIsVisible(true);
    };

    const handleFocus = () => {
      if (!triggerEl.matches(":focus-visible")) return;

      setIsVisible(true);
    };

    triggerEl.addEventListener("pointerenter", handlePointerEnter);
    triggerEl.addEventListener("pointerleave", hide);
    triggerEl.addEventListener("pointercancel", hide);
    triggerEl.addEventListener("focus", handleFocus);
    triggerEl.addEventListener("blur", hide);
    triggerEl.addEventListener("pointerdown", hide);

    return () => {
      triggerEl.removeEventListener("pointerenter", handlePointerEnter);
      triggerEl.removeEventListener("pointerleave", hide);
      triggerEl.removeEventListener("pointercancel", hide);
      triggerEl.removeEventListener("focus", handleFocus);
      triggerEl.removeEventListener("blur", hide);
      triggerEl.removeEventListener("pointerdown", hide);
    };
  }, [triggerEl]);

  useLayoutEffect(() => {
    if (isDisabled || !isVisible) {
      setCoords(null);
      return;
    }

    const updatePosition = () => {
      const triggerRect = triggerEl?.getBoundingClientRect();
      const tooltipRect = tooltipRef.current?.getBoundingClientRect();

      if (!triggerRect || !tooltipRect) return;

      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let side = position;

      if (side === "top" && triggerRect.top - GAP - tooltipRect.height < 0) {
        side = "bottom";
      } else if (
        side === "bottom" &&
        triggerRect.bottom + GAP + tooltipRect.height > viewportHeight
      ) {
        side = "top";
      } else if (
        side === "left" &&
        triggerRect.left - GAP - tooltipRect.width < 0
      ) {
        side = "right";
      } else if (
        side === "right" &&
        triggerRect.right + GAP + tooltipRect.width > viewportWidth
      ) {
        side = "left";
      }

      let top: number;
      let left: number;

      if (side === "top" || side === "bottom") {
        top =
          side === "top"
            ? triggerRect.top - GAP - tooltipRect.height
            : triggerRect.bottom + GAP;

        left =
          align === "start"
            ? triggerRect.left
            : align === "end"
              ? triggerRect.right - tooltipRect.width
              : triggerRect.left +
                triggerRect.width / 2 -
                tooltipRect.width / 2;

        left = Math.min(
          Math.max(left, VIEWPORT_PADDING),
          viewportWidth - tooltipRect.width - VIEWPORT_PADDING
        );
      } else {
        left =
          side === "left"
            ? triggerRect.left - GAP - tooltipRect.width
            : triggerRect.right + GAP;

        top =
          align === "start"
            ? triggerRect.top
            : align === "end"
              ? triggerRect.bottom - tooltipRect.height
              : triggerRect.top +
                triggerRect.height / 2 -
                tooltipRect.height / 2;

        top = Math.min(
          Math.max(top, VIEWPORT_PADDING),
          viewportHeight - tooltipRect.height - VIEWPORT_PADDING
        );
      }

      setCoords({ top, left });
    };

    updatePosition();

    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);

    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [isVisible, isDisabled, position, align, triggerEl]);

  if (!isValidElement(children)) return children;

  const trigger = cloneElement(
    children as ReactElement<{ ref?: Ref<HTMLElement> }>,
    {
      ref: mergeRefs(
        setTriggerEl,
        (children as ReactElement<{ ref?: Ref<HTMLElement> }>).props.ref
      ),
    }
  );

  return (
    <>
      {trigger}
      {!isDisabled &&
        isVisible &&
        createPortal(
          <div
            ref={tooltipRef}
            style={{
              position: "fixed",
              top: coords?.top,
              left: coords?.left,
              visibility: coords ? "visible" : "hidden",
            }}
            className={classNames(styles.tooltip, className)}
          >
            {content}
          </div>,
          root || document.getElementById("tooltip-connector") || document.body
        )}
    </>
  );
};
