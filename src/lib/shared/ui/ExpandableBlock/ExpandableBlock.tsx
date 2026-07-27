"use client";

import { FC, ReactNode, useEffect, useState } from "react";
import { useResizeDetector } from "react-resize-detector";
import classNames from "classnames";
import styles from "./ExpandableBlock.module.scss";
import { Button, ButtonColor } from "../Button";
import { SvgChevron } from "../svg";

interface IExpandableBlockProps {
  children: ReactNode;
  className?: string;
}

export const ExpandableBlock: FC<IExpandableBlockProps> = ({
  children,
  className,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);

  const { ref, width, height } = useResizeDetector();

  useEffect(() => {
    const el = ref.current;

    if (!el || isExpanded) return;

    setIsOverflowing(el.scrollHeight > el.clientHeight + 1);
  }, [ref, width, height, isExpanded, children]);

  return (
    <div className={className}>
      <div
        ref={ref}
        className={classNames(styles.content, {
          [styles.content_clamped]: !isExpanded,
        })}
      >
        {children}
      </div>
      {isOverflowing && (
        <Button
          compact
          color={ButtonColor.TRANSPARENT}
          className={styles.toggle}
          onClick={() => setIsExpanded((value) => !value)}
        >
          {isExpanded ? "Show less" : "Show more"}
          <SvgChevron
            size="16"
            className={classNames(styles.toggle__icon, {
              [styles.toggle__icon_active]: isExpanded,
            })}
          />
        </Button>
      )}
    </div>
  );
};
