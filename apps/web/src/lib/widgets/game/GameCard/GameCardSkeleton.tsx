import { CSSProperties, FC } from "react";
import classNames from "classnames";
import styles from "./GameCard.module.scss";
import { Skeleton } from "@/src/lib/shared/ui/Skeleton";

interface IGameCardSkeletonProps {
  className?: string;
  style?: CSSProperties;
}

export const GameCardSkeleton: FC<IGameCardSkeletonProps> = ({
  className,
  style,
}) => (
  <div className={classNames(styles.wrapper, className)} style={style}>
    <Skeleton aspectRatio="var(--cover-ratio)" radius="var(--radius-x4)" />
  </div>
);
