import styles from "./WheelCSS.module.scss";
import { FC } from "react";

export const WheelCSS: FC = () => {
  return (
    <fieldset className={styles.wheel}>
      <ul data-itemCount="12">
        <li>$1000</li>
        <li>$2000</li>
        <li>$3000</li>
        <li>$4000</li>
        <li>$5000</li>
        <li>$6000</li>
        <li>$7000</li>
        <li>$8000</li>
        <li>$9000</li>
        <li>$10000</li>
        <li>$11000</li>
        <li>$12000</li>
      </ul>
      <button type="button">SPIN</button>
    </fieldset>
  );
};
