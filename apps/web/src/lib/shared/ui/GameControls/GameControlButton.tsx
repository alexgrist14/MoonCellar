import { FC, ReactNode, Ref } from "react";
import classNames from "classnames";
import { Button, ButtonColor } from "../Button";
import { IGameControlTone } from "./gameControls.utils";
import styles from "./GameControls.module.scss";

interface IGameControlButtonProps {
  icon: ReactNode;
  label: string;
  tooltip?: string;
  tooltipAlign?: "left" | "right" | "center";
  tone?: IGameControlTone;
  badge?: number;
  isActive?: boolean;
  isDisabled?: boolean;
  isPressed?: boolean;
  isExpanded?: boolean;
  onClick?: () => void;
  ref?: Ref<HTMLButtonElement>;
}

export const GameControlButton: FC<IGameControlButtonProps> = ({
  icon,
  label,
  tooltip,
  tooltipAlign,
  tone,
  badge,
  isActive,
  isDisabled,
  isPressed,
  isExpanded,
  onClick,
  ref,
}) => (
  <Button
    ref={ref}
    color={ButtonColor.TRANSPARENT}
    tooltip={tooltip}
    tooltipAlign={tooltipAlign}
    aria-label={label}
    aria-pressed={isPressed}
    aria-expanded={isExpanded}
    aria-disabled={isDisabled || undefined}
    data-prevent-progress
    className={classNames(styles.controls__action, {
      [styles.controls__action_disabled]: isDisabled,
    })}
    onClick={(event) => {
      event.preventDefault();
      event.stopPropagation();

      if (!isDisabled) onClick?.();
    }}
  >
    <span
      className={classNames(
        styles.controls__glyph,
        !!tone && styles[`controls__glyph_${tone}`],
        {
          [styles.controls__glyph_active]: isActive,
          [styles.controls__glyph_disabled]: isDisabled,
        }
      )}
    >
      {icon}
      {!!badge && <span className={styles.controls__badge}>{badge}</span>}
    </span>
  </Button>
);
