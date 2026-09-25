"use client";

import {
  CSSProperties,
  FC,
  ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useResizeDetector } from "react-resize-detector";
import classNames from "classnames";
import styles from "./ExpandableBlock.module.scss";
import { Box } from "../Box";
import { Button, ButtonColor } from "../Button";
import { modal } from "../Modal";
import { DRAWER_TRIGGER_ATTRIBUTE, drawer } from "../Drawer/drawer.api";
import { Scrollbar } from "../Scrollbar";
import { SvgOpenWindow } from "../svg";

export type IExpandableBlockMode = "modal" | "drawer" | "scroll";

interface IExpandableBlockProps {
  children: ReactNode;
  className?: string;
  classNameContent?: string;
  clampHeight?: string;
  title?: string;
  mode?: IExpandableBlockMode;
}

const ScrollableBlock: FC<Omit<IExpandableBlockProps, "mode" | "title">> = ({
  children,
  className,
  classNameContent,
  clampHeight,
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [fade, setFade] = useState({ top: false, bottom: false });

  const updateFade = useCallback(() => {
    const element = contentRef.current;

    if (!element) return;

    const scrollOffset = element.scrollHeight - element.clientHeight;

    setFade((current) => {
      const next = {
        top: element.scrollTop > 1,
        bottom: scrollOffset - element.scrollTop > 1,
      };

      return current.top === next.top && current.bottom === next.bottom
        ? current
        : next;
    });
  }, []);

  const { width, height } = useResizeDetector({ targetRef: contentRef });

  useEffect(() => {
    updateFade();
  }, [updateFade, width, height, children]);

  return (
    <div
      className={classNames(styles.scroll, className, {
        [styles.scroll_fadeTop]: fade.top,
        [styles.scroll_fadeBottom]: fade.bottom,
      })}
    >
      <Scrollbar
        type="absolute"
        initialContentRef={contentRef}
        classNameContent={classNames(styles.scroll__content, classNameContent)}
        classNameScrollbar={styles.scroll__scrollbar}
        contentStyle={
          {
            maxHeight: clampHeight ?? "var(--expandable-scroll-height)",
          } as CSSProperties
        }
        onScroll={updateFade}
      >
        {children}
      </Scrollbar>
    </div>
  );
};

export const ExpandableBlock: FC<IExpandableBlockProps> = ({
  children,
  className,
  classNameContent,
  clampHeight,
  title,
  mode = "modal",
}) => {
  const [isOverflowing, setIsOverflowing] = useState(false);

  const { ref, width, height } = useResizeDetector();

  useEffect(() => {
    if (mode === "scroll") return;

    const el = ref.current;

    if (!el) return;

    setIsOverflowing(el.scrollHeight > el.clientHeight + 1);
  }, [ref, width, height, children, mode]);

  if (mode === "scroll") {
    return (
      <ScrollableBlock
        className={className}
        classNameContent={classNameContent}
        clampHeight={clampHeight}
      >
        {children}
      </ScrollableBlock>
    );
  }

  const openModal = () =>
    modal.open(
      <Box
        title={title}
        isTitleStart
        isWithScrollBar
        className={styles.modal}
        contentStyle={{ padding: "var(--padding-x4)" }}
      >
        <div className={classNameContent}>{children}</div>
      </Box>,
      { id: "expandable-block" }
    );

  const openDrawer = () =>
    drawer.open(<div className={classNameContent}>{children}</div>, {
      title,
    });

  return (
    <div className={className}>
      <div
        ref={ref}
        style={!!clampHeight ? { maxHeight: clampHeight } : undefined}
        className={classNames(styles.content, classNameContent, {
          [styles.content_clamped]: !clampHeight,
          [styles.content_limited]: !!clampHeight,
          [styles.content_faded]: isOverflowing,
        })}
      >
        {children}
      </div>
      {isOverflowing && (
        <Button
          compact
          color={ButtonColor.TRANSPARENT}
          className={styles.toggle}
          onClick={mode === "drawer" ? openDrawer : openModal}
          {...(mode === "drawer" && { [DRAWER_TRIGGER_ATTRIBUTE]: "" })}
        >
          Show more
          <SvgOpenWindow size="16" className={styles.toggle__icon} />
        </Button>
      )}
    </div>
  );
};
