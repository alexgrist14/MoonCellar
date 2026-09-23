"use client";

import {
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

export const DrawerConnector = () => {
  const [content, setContent] = useState<IDrawerState | null>(null);
  const [isOpen, setIsOpen] = useState(false);

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

  if (!content) return null;

  return (
    <aside
      ref={panelRef}
      role="dialog"
      aria-modal="false"
      aria-label={content.params.title}
      className={classNames(styles.drawer, { [styles.drawer_open]: isOpen })}
      onTransitionEnd={handleTransitionEnd}
    >
      <Box
        title={content.params.title}
        isTitleStart
        isWithBlur
        isWithScrollBar
        onClose={closeDrawer}
        closeButtonRef={closeButtonRef}
        className={styles.drawer__box}
        wrapperStyle={{ height: "100%" }}
        templateStyle={{ height: "100%" }}
        contentStyle={{ padding: "var(--padding-x4)" }}
      >
        {content.component}
      </Box>
    </aside>
  );
};
