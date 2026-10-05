import {
  CSSProperties,
  HTMLAttributes,
  memo,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import styles from "./ExpandMenu.module.scss";
import { Scrollbar } from "../Scrollbar";
import { IExpandPosition } from "@/src/lib/shared/store/common.store";
import classNames from "classnames";
import { useStatesStore } from "@/src/lib/shared/store/states.store";
import { useResizeDetector } from "react-resize-detector";
import { useExpandStore } from "@/src/lib/shared/store/expand.store";
import { createPortal } from "react-dom";
import { useCloseEvents } from "@/src/lib/shared/hooks/useCloseEvents";
import { useSwipeDismiss } from "@/src/lib/shared/hooks/useSwipeDismiss";

interface IExpandMenuProps extends Pick<
  HTMLAttributes<HTMLDivElement>,
  "children"
> {
  position?: IExpandPosition;
  titleOpen?: string | ReactNode;
  titleClose?: string | ReactNode;
  titleClassName?: string;
  titleStyle?: CSSProperties;
}

export const EXPAND_KEEP_OPEN_ATTRIBUTE = "data-keep-expand-open";

export const ExpandMenu = memo(
  ({
    children,
    position = "left",
    titleClose,
    titleOpen,
    titleClassName,
    titleStyle,
  }: IExpandMenuProps) => {
    const { expanded, setExpanded } = useExpandStore();
    const { isMobile } = useStatesStore();

    const expandRef = useRef<HTMLDivElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    const isActive = expanded?.includes(position);

    const { ref } = useResizeDetector({
      refreshMode: "debounce",
      refreshRate: 200,
    });

    const [connector, setConnector] = useState<HTMLElement | null>(null);

    useEffect(() => {
      setConnector(document.getElementById("expand-connector"));
    }, []);

    const closeHandler = useCallback(
      () =>
        isActive &&
        setExpanded(expanded?.filter((pos) => pos !== position) || []),
      [isActive, expanded, position, setExpanded]
    );

    const closeRefs = useMemo(() => [expandRef], []);

    const onCloseEvent = useCallback(
      (event?: Event) => {
        const target = event?.target as HTMLElement | null;

        if (target?.closest(`[${EXPAND_KEEP_OPEN_ATTRIBUTE}]`)) return;

        closeHandler();
      },
      [closeHandler]
    );

    useCloseEvents(closeRefs, onCloseEvent);

    const { offset, isDragging, resetOffset, swipeHandlers } = useSwipeDismiss({
      ref: menuRef,
      direction: position.includes("right") ? "right" : "left",
      onDismiss: closeHandler,
    });

    useEffect(() => {
      if (isActive) resetOffset();
    }, [isActive, resetOffset]);

    if (!connector) return null;

    return createPortal(
      <div
        id={position}
        key={position}
        ref={expandRef}
        className={classNames(styles.wrapper, {
          [styles.wrapper_right]: position.includes("right"),
          [styles.wrapper_active]: isActive,
        })}
        style={
          position.includes("bottom")
            ? { top: "unset", bottom: "0" }
            : undefined
        }
      >
        <div
          ref={menuRef}
          className={classNames(styles.menu, {
            [styles.menu_right]: position.includes("right"),
            [styles.menu_disabled]: isMobile && !isActive,
            [styles.menu_active]: isActive,
            [styles.menu_dragging]: isDragging,
          })}
          style={{ "--expand-offset": `${offset}px` } as CSSProperties}
          {...swipeHandlers}
        >
          <Scrollbar
            type="absolute"
            classNameContainer={styles.scrollbars__container}
            classNameContent={styles.scrollbars__content}
            classNameScrollbar={styles.scrollbars__scrollbar}
            contentStyle={{
              ...(position.includes("bottom")
                ? { paddingBottom: "var(--padding-x14)" }
                : { paddingTop: "var(--padding-x14)" }),
            }}
          >
            <div className={classNames(styles.menu__content)} ref={ref}>
              {children}
            </div>
          </Scrollbar>
        </div>
        <div
          onClick={() => {
            isActive
              ? closeHandler()
              : setExpanded(
                  !!expanded?.length ? [...expanded, position] : [position]
                );
          }}
          className={classNames(
            styles.title,
            styles[`title_${position}`],
            titleClassName,
            {
              [styles[`title_${position}_active`]]: isActive,
              [styles.title_bottom]: position.includes("bottom"),
            }
          )}
          style={titleStyle}
        >
          <span>{isActive ? titleClose || "Close" : titleOpen || "Open"}</span>
        </div>
      </div>,
      connector
    );
  }
);

ExpandMenu.displayName = "ExpandMenu";
