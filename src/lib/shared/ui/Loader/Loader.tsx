import { FC } from "react";
import styles from "./Loader.module.scss";
import {
  PacmanLoader,
  PropagateLoader,
  PulseLoader,
  MoonLoader,
} from "react-spinners";
import classNames from "classnames";

export const Loader: FC<{
  type?: "pulse" | "propogate" | "pacman" | "moon";
  color?: string;
  speedMultiplier?: number;
}> = ({ type = "pulse", color, speedMultiplier }) => {
  return (
    <div className={classNames(styles.loader)}>
      {type === "pulse" && (
        <PulseLoader
          speedMultiplier={speedMultiplier}
          color={color || "#ffffff"}
        />
      )}
      {type === "propogate" && (
        <PropagateLoader
          speedMultiplier={speedMultiplier}
          color={color || "#ffffff"}
        />
      )}
      {type === "pacman" && (
        <PacmanLoader
          speedMultiplier={speedMultiplier}
          color={color || "#ffffff"}
        />
      )}
      {type === "moon" && (
        <MoonLoader
          speedMultiplier={speedMultiplier}
          color={color || "#ffffff"}
        />
      )}
    </div>
  );
};
