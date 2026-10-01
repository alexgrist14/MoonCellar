import { FC } from "react";
import styles from "./PageLoader.module.scss";
import { Loader } from "../Loader";

export const PageLoader: FC = () => {
  return (
    <div className={styles.pageLoader}>
      <Loader type="moon" color="var(--color-accent)" />
    </div>
  );
};
