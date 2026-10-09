import { CSSProperties, FC } from "react";
import classNames from "classnames";
import styles from "./Skeleton.module.scss";

export interface ISkeletonProps {
  shape?: "block" | "text" | "circle";
  width?: string;
  height?: string;
  aspectRatio?: string;
  radius?: string;
  count?: number;
  gap?: string;
  className?: string;
  style?: CSSProperties;
}

export const Skeleton: FC<ISkeletonProps> = ({
  shape = "block",
  width,
  height,
  aspectRatio,
  radius,
  count = 1,
  gap,
  className,
  style,
}) => {
  const isGroup = count > 1;

  const items = Array.from({ length: count }, (_, index) => (
    <span
      key={index}
      aria-hidden
      className={classNames(
        styles.skeleton,
        styles[`skeleton_${shape}`],
        !isGroup && className
      )}
      style={{
        width,
        height,
        aspectRatio,
        borderRadius: radius,
        ...(!isGroup && style),
      }}
    />
  ));

  if (!isGroup) return items[0];

  return (
    <span
      aria-hidden
      className={classNames(styles.group, className)}
      style={{ gap, ...style }}
    >
      {items}
    </span>
  );
};
