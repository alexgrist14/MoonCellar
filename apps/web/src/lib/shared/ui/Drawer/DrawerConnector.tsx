"use client";

import {
  CSSProperties,
  PointerEvent,
  TransitionEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import classNames from "classnames";
import { usePathname } from "next/navigation";
import styles from "./Drawer.module.scss";
import { IDrawerParams, IDrawerState } from "./Drawer.types";
import { DRAWER_TRIGGER_ATTRIBUTE, drawerEvents } from "./drawer.api";
import { Box } from "../Box";
import { useExpandStore } from "@/src/lib/shared/store/expand.store";

const IGNORED_CLICK_TARGETS = [
  `[${DRAWER_TRIGGER_ATTRIBUTE}]`,
  "#modals",
  "#dropdown-connector",
  "#tooltip-connector",
].join(", ");

const DISMISS_SHARE = 1 / 3;
const DISMISS_VELOCITY = 0.5;
const SWIPE_THRESHOLD = 10;

interface ISwipe {
  startX: number;
  startY: number;
  lastX: number;
  lastTime: number;
  velocity: number;
  isHorizontal?: boolean;
}

export const DrawerConnector = () => {
  const [content, setContent] = useState<IDrawerState | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [offset, setOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const swipe = useRef<ISwipe | null>(null);

  const panelRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef<IDrawerParams["onClose"]>(undefined);

  const pathname = usePathname();
  const expanded = useExpandStore((state) => state.expanded);
  const setExpanded = useExpandStore((state) => state.setExpanded);

  const isOpenRef = useRef(false);
  const openFrameRef = useRef<number>(undefined);

  const cancelOpenFrame = () => {
    if (openFrameRef.current !== undefined) {
      cancelAnimationFrame(openFrameRef.current);
      openFrameRef.current = undefined;
    }
  };

  const closeDrawer = useCallback(() => {
    if (!isOpenRef.current) return;

    cancelOpenFrame();
    isOpenRef.current = false;
    setIsOpen(false);
    onCloseRef.current?.();
  }, []);

  const openDrawer = useCallback(
    ({ component, params }: IDrawerState) => {
      onCloseRef.current = params.onClose;
      isOpenRef.current = true;
      setContent({ component, params });
      setOffset(0);
      setExpanded([]);

      cancelOpenFrame();
      openFrameRef.current = requestAnimationFrame(() => {
        openFrameRef.current = requestAnimationFrame(() => {
          openFrameRef.current = undefined;
          setIsOpen(true);
        });
      });
    },
    [setExpanded]
  );

  useEffect(() => cancelOpenFrame, []);

  useEffect(() => {
    drawerEvents.on("open", openDrawer);
    drawerEvents.on("close", closeDrawer);

    return () => {
      drawerEvents.off("open", openDrawer);
      drawerEvents.off("close", closeDrawer);
    };
  }, [openDrawer, closeDrawer]);

  useEffect(() => {
    if (!!expanded?.length) closeDrawer();
  }, [expanded, closeDrawer]);

  useEffect(() => {
    closeDrawer();
  }, [pathname, closeDrawer]);

  useEffect(() => {
    if (!isOpen) return;

    closeButtonRef.current?.focus({ preventScroll: true });

    const handleMouseDown = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;

      if (
        !target ||
        panelRef.current?.contains(target) ||
        target.closest(IGNORED_CLICK_TARGETS)
      ) {
        return;
      }

      closeDrawer();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      const hasOpenModal = !!document.getElementById("modals")?.children.length;

      if (event.key === "Escape" && !hasOpenModal) closeDrawer();
    };

    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("popstate", closeDrawer);

    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("popstate", closeDrawer);
    };
  }, [isOpen, closeDrawer]);

  const handleTransitionEnd = (event: TransitionEvent<HTMLElement>) => {
    if (
      event.target === event.currentTarget &&
      event.propertyName === "transform" &&
      !isOpen
    ) {
      setContent(null);
    }
  };

  const handlePointerDown = (event: PointerEvent<HTMLElement>) => {
    if (event.pointerType === "mouse") return;

    swipe.current = {
      startX: event.clientX,
      startY: event.clientY,
      lastX: event.clientX,
      lastTime: performance.now(),
      velocity: 0,
    };
  };

  const handlePointerMove = (event: PointerEvent<HTMLElement>) => {
    const state = swipe.current;

    if (!state) return;

    const deltaX = event.clientX - state.startX;
    const deltaY = event.clientY - state.startY;

    if (state.isHorizontal === undefined) {
      if (Math.max(Math.abs(deltaX), Math.abs(deltaY)) < SWIPE_THRESHOLD) {
        return;
      }

      state.isHorizontal = deltaX > 0 && Math.abs(deltaX) > Math.abs(deltaY);

      if (!state.isHorizontal) return;

      event.currentTarget.setPointerCapture(event.pointerId);
      setIsDragging(true);
    }

    if (!state.isHorizontal) return;

    const now = performance.now();

    state.velocity =
      (event.clientX - state.lastX) / Math.max(now - state.lastTime, 1);
    state.lastX = event.clientX;
    state.lastTime = now;

    setOffset(Math.max(deltaX, 0));
  };

  const handlePointerUp = () => {
    const state = swipe.current;

    swipe.current = null;

    if (!state?.isHorizontal) return;

    setIsDragging(false);

    const width = panelRef.current?.offsetWidth ?? 0;

    if (state.velocity > DISMISS_VELOCITY || offset > width * DISMISS_SHARE) {
      setOffset(width);
      closeDrawer();
      return;
    }

    setOffset(0);
  };

  if (!content) return null;

  return (
    <aside
      ref={panelRef}
      role="dialog"
      aria-modal="false"
      aria-label={content.params.title}
      className={classNames(styles.drawer, {
        [styles.drawer_open]: isOpen,
        [styles.drawer_dragging]: isDragging,
      })}
      style={{ "--drawer-offset": `${offset}px` } as CSSProperties}
      onTransitionEnd={handleTransitionEnd}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <Box
        title={content.params.title}
        isTitleStart
        isWithBlur
        isWithScrollBar
        onClose={closeDrawer}
        closeButtonRef={closeButtonRef}
        className={styles.drawer__box}
        classNameContent={styles.drawer__content}
        wrapperStyle={{ height: "100%" }}
        templateStyle={{ height: "100%", minHeight: 0 }}
        contentStyle={{ padding: "var(--padding-x4)" }}
      >
        {content.component}
      </Box>
    </aside>
  );
};
