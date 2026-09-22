import { FC, ReactNode } from "react";
import classNames from "classnames";
import { commonUtils } from "@/src/lib/shared/utils/common.utils";
import styles from "./StatusBadge.module.scss";

interface IStatusBadgeProps {
  status?: string;
  children?: ReactNode;
  className?: string;
}

interface IStatusDetailsProps {
  items: (string | false | null | undefined)[];
  className?: string;
}

export const StatusBadge: FC<IStatusBadgeProps> = ({
  status,
  children,
  className,
}) => {
  const key = status?.trim().toLowerCase() ?? "";

  return (
    <span
      className={classNames(styles.badge, styles[`badge_${key}`], className)}
    >
      {children ?? commonUtils.upFL(key)}
    </span>
  );
};

export const StatusDetails: FC<IStatusDetailsProps> = ({
  items,
  className,
}) => {
  const text = items.filter(Boolean).join(" · ");

  return text ? (
    <span className={classNames(styles.details, className)}>{text}</span>
  ) : null;
};
