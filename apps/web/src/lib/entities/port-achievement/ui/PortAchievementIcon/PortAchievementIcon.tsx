import { CSSProperties, FC } from "react";
import classNames from "classnames";
import { portAchievementsApi } from "@/src/lib/shared/api";
import styles from "./PortAchievementIcon.module.scss";

interface IPortAchievementIconProps {
  icon: string;
  isUnlocked?: boolean;
  size?: "md" | "sm";
  className?: string;
}

// The service's icons are outlines in currentColor, which an <img> paints black: the icon is a
// mask over the tile's own colour instead
export const PortAchievementIcon: FC<IPortAchievementIconProps> = ({
  icon,
  isUnlocked,
  size = "md",
  className,
}) => (
  <span
    className={classNames(
      styles.icon,
      styles[`icon_${size}`],
      { [styles.icon_unlocked]: isUnlocked },
      className
    )}
    style={
      {
        "--port-achievement-icon": `url("${portAchievementsApi.getIconUrl(icon)}")`,
      } as CSSProperties
    }
    aria-hidden
  />
);
