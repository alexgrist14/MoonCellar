"use client";

import { FC, ReactNode, useEffect, useState } from "react";
import { useResizeDetector } from "react-resize-detector";
import classNames from "classnames";
import styles from "./ExpandableBlock.module.scss";
import { Box } from "../Box";
import { Button, ButtonColor } from "../Button";
import { modal } from "../Modal";
import { SvgOpenWindow } from "../svg";

interface IExpandableBlockProps {
  children: ReactNode;
  className?: string;
  classNameContent?: string;
  clampHeight?: string;
  modalTitle?: string;
}

export const ExpandableBlock: FC<IExpandableBlockProps> = ({
  children,
  className,
  classNameContent,
  clampHeight,
  modalTitle,
}) => {
  const [isOverflowing, setIsOverflowing] = useState(false);

  const { ref, width, height } = useResizeDetector();

  useEffect(() => {
    const el = ref.current;

    if (!el) return;

    setIsOverflowing(el.scrollHeight > el.clientHeight + 1);
  }, [ref, width, height, children]);

  const openModal = () =>
    modal.open(
      <Box
        title={modalTitle}
        isTitleStart
        isWithScrollBar
        className={styles.modal}
        contentStyle={{ padding: "var(--padding-x4)" }}
      >
        <div className={classNameContent}>{children}</div>
      </Box>,
      { id: "expandable-block" }
    );

  return (
    <div className={className}>
      <div
        ref={ref}
        style={!!clampHeight ? { maxHeight: clampHeight } : undefined}
        className={classNames(styles.content, classNameContent, {
          [styles.content_clamped]: !clampHeight,
          [styles.content_limited]: !!clampHeight,
        })}
      >
        {children}
      </div>
      {isOverflowing && (
        <Button
          compact
          color={ButtonColor.TRANSPARENT}
          className={styles.toggle}
          onClick={openModal}
        >
          Show more
          <SvgOpenWindow size="16" className={styles.toggle__icon} />
        </Button>
      )}
    </div>
  );
};
