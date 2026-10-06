import { FC, ReactNode } from "react";
import styles from "./RowsModal.module.scss";
import classNames from "classnames";
import { Box } from "../Box";

interface IRowsModalProps {
  title?: string;
  rows: ReactNode[];
  emptyState?: ReactNode;
  classNameRow?: string;
  className?: string;
}

export const RowsModal: FC<IRowsModalProps> = ({
  title,
  rows,
  emptyState,
  classNameRow,
  className,
}) => {
  return (
    <Box
      title={title}
      isWithScrollBar
      contentStyle={{
        padding: "var(--padding-x4)",
        minWidth: "min(var(--rows-modal-min-width, 320px), calc(100vw - 40px))",
        maxWidth: "var(--rows-modal-max-width, 420px)",
      }}
      classNameContent={classNames(styles.list, className)}
    >
      {rows.length
        ? rows.map((row, i) => (
            <div key={i} className={classNames(styles.row, classNameRow)}>
              {row}
            </div>
          ))
        : emptyState}
    </Box>
  );
};
