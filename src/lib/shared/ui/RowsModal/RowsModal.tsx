import { FC, ReactNode } from "react";
import styles from "./RowsModal.module.scss";
import { Box } from "../Box";

interface IRowsModalProps {
  title?: string;
  rows: ReactNode[];
  emptyState?: ReactNode;
}

export const RowsModal: FC<IRowsModalProps> = ({
  title,
  rows,
  emptyState,
}) => {
  return (
    <Box
      title={title}
      isWithScrollBar
      contentStyle={{ padding: "var(--padding-x4)" }}
      classNameContent={styles.list}
    >
      {rows.length
        ? rows.map((row, i) => (
            <div key={i} className={styles.row}>
              {row}
            </div>
          ))
        : emptyState}
    </Box>
  );
};
