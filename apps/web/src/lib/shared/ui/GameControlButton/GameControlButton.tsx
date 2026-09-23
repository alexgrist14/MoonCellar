import { FC, ReactNode, Ref } from "react";
import classNames from "classnames";
import { Button, ButtonColor } from "@/src/lib/shared/ui/Button";
import { IGameControlTone } from "./gameControls.utils";
import styles from "./GameControlButton.module.scss";

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
    className={classNames(styles.action, {
      [styles.action_disabled]: isDisabled,
    })}
    onClick={(event) => {
      event.preventDefault();
      event.stopPropagation();

      if (!isDisabled) onClick?.();
    }}
  >
    <span
      className={classNames(
        styles.glyph,
        !!tone && styles[`glyph_${tone}`],
        {
          [styles.glyph_active]: isActive,
          [styles.glyph_disabled]: isDisabled,
        }
      )}
    >
      {icon}
      {!!badge && <span className={styles.badge}>{badge}</span>}
    </span>
  </Button>
);
