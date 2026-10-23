import { FC, Fragment } from "react";
import styles from "./PlanBlock.module.scss";

export const PlanText: FC<{ text: string }> = ({ text }) => (
  <>
    {text.split("`").map((part, index) =>
      index % 2 ? (
        <code key={index} className={styles.code}>
          {part}
        </code>
      ) : (
        <Fragment key={index}>{part}</Fragment>
      )
    )}
  </>
);
