import { FC } from "react";
import styles from "./PageLoader.module.scss";
import { Loader } from "../Loader";

const lightAccentColor = "#8f7df2";

export const PageLoader: FC = () => {
  return (
    <div className={styles.pageLoader}>
      <Loader type="moon" color={lightAccentColor} />
    </div>
  );
};
