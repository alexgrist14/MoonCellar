import { FC, ReactNode } from "react";
import classNames from "classnames";
import styles from "./StatRows.module.scss";

export interface IStatRow {
  key?: string;
  label: ReactNode;
  value: ReactNode;
  unit?: ReactNode;
  icon?: ReactNode;
  title?: string;
}

interface IStatRowsProps {
  rows: IStatRow[];
  className?: string;
}

export const StatRows: FC<IStatRowsProps> = ({ rows, className }) => {
  if (!rows.length) return null;

  return (
    <dl className={classNames(styles.rows, className)}>
      {rows.map(({ key, label, value, unit, icon, title }, index) => (
        <div
          key={key ?? (typeof label === "string" ? label : index)}
          className={styles.rows__row}
          title={title}
        >
          {!!icon && <span className={styles.rows__icon}>{icon}</span>}
          <dt className={styles.rows__label}>{label}</dt>
          <dd className={styles.rows__value}>
            {value}
            {!!unit && <span className={styles.rows__unit}>{unit}</span>}
          </dd>
        </div>
      ))}
    </dl>
  );
};
