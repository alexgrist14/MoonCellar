import { FC, Fragment, ReactNode } from "react";
import classNames from "classnames";
import { commonUtils } from "@/src/lib/shared/utils/common.utils";
import styles from "./StatusBadge.module.scss";

interface IStatusBadgeProps {
  status?: string;
  children?: ReactNode;
  className?: string;
}

interface IStatusDetailsProps {
  items: ReactNode[];
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
  const parts = items.filter(Boolean);

  return parts.length ? (
    <span className={classNames(styles.details, className)}>
      {parts.map((part, index) => (
        <Fragment key={index}>
          {index > 0 && " · "}
          {part}
        </Fragment>
      ))}
    </span>
  ) : null;
};
