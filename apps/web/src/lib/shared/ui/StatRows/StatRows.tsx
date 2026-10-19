import { FC, KeyboardEvent, MouseEvent, ReactNode } from "react";
import classNames from "classnames";
import styles from "./StatRows.module.scss";

export interface IStatRow {
  key?: string;
  label: ReactNode;
  sublabel?: ReactNode;
  value: ReactNode;
  unit?: ReactNode;
  icon?: ReactNode;
  title?: string;
  onClick?: (event: MouseEvent<HTMLDivElement>) => void;
}

interface IStatRowsProps {
  rows: IStatRow[];
  className?: string;
}

const clickOnEnterOrSpace = (event: KeyboardEvent<HTMLDivElement>) => {
  if (event.key !== "Enter" && event.key !== " ") return;

  event.preventDefault();
  event.currentTarget.click();
};

export const StatRows: FC<IStatRowsProps> = ({ rows, className }) => {
  if (!rows.length) return null;

  return (
    <dl className={classNames(styles.rows, className)}>
      {rows.map(
        (
          { key, label, sublabel, value, unit, icon, title, onClick },
          index
        ) => (
          <div
            key={key ?? (typeof label === "string" ? label : index)}
            className={classNames(styles.rows__row, {
              [styles.rows__row_interactive]: !!onClick,
            })}
            title={title}
            {...(onClick && {
              role: "button",
              tabIndex: 0,
              onClick,
              onKeyDown: clickOnEnterOrSpace,
            })}
          >
            {!!icon && <span className={styles.rows__icon}>{icon}</span>}
            <dt className={styles.rows__label}>
              {label}
              {!!sublabel && (
                <span className={styles.rows__sublabel}>{sublabel}</span>
              )}
            </dt>
            <dd className={styles.rows__value}>
              {value}
              {!!unit && <span className={styles.rows__unit}>{unit}</span>}
            </dd>
          </div>
        )
      )}
    </dl>
  );
};
