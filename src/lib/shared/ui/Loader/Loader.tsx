import { FC } from "react";
import styles from "./Loader.module.scss";
import { PacmanLoader, PropagateLoader, PulseLoader } from "react-spinners";

export const Loader: FC = ({
  type = "pulse",
  color,
}: {
  type?: "pulse" | "propogate" | "pacman";
  color?: string;
}) => {
  return (
    <div className={styles.loader}>
      {type === "pulse" && <PulseLoader color={color || "#ffffff"} />}
      {type === "propogate" && <PropagateLoader color={color || "#ffffff"} />}
      {type === "pacman" && <PacmanLoader color={color || "#ffffff"} />}
    </div>
  );
};
