import { FC } from "react";
import classNames from "classnames";
import { IContentRequestStatus } from "@mooncellar/schemas";
import styles from "./RequestStatus.module.scss";

const LABELS: Record<IContentRequestStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

export const RequestStatus: FC<{ status: IContentRequestStatus }> = ({
  status,
}) => (
  <span className={classNames(styles.status, styles[`status_${status}`])}>
    {LABELS[status]}
  </span>
);
