import { FC } from "react";
import styles from "./Loader.module.scss";
import {
  PacmanLoader,
  PropagateLoader,
  PulseLoader,
  MoonLoader,
} from "react-spinners";
import classNames from "classnames";
import { accentColor } from "@/src/lib/shared/constants";

export interface ILoaderProps {
  type?: "pulse" | "propogate" | "pacman" | "moon";
  color?: string;
  size?: number | string;
  speedMultiplier?: number;
  className?: string;
  isBlock?: boolean;
  minHeight?: string;
}

export const Loader: FC<ILoaderProps> = ({
  type = "pulse",
  color,
  size,
  speedMultiplier,
  className,
  isBlock,
  minHeight,
}) => {
  const isBlockMode = isBlock || !!minHeight;
  const spinnerProps = { speedMultiplier, size, color: color || accentColor };

  const loader = (
    <div className={classNames(styles.loader, !isBlockMode && className)}>
      {type === "pulse" && <PulseLoader {...spinnerProps} />}
      {type === "propogate" && <PropagateLoader {...spinnerProps} />}
      {type === "pacman" && <PacmanLoader {...spinnerProps} />}
      {type === "moon" && <MoonLoader {...spinnerProps} />}
    </div>
  );

  if (!isBlockMode) return loader;

  return (
    <div
      className={classNames(styles.block, className)}
      style={minHeight ? { minHeight } : undefined}
      role="status"
      aria-label="Loading"
      aria-busy
    >
      {loader}
    </div>
  );
};
