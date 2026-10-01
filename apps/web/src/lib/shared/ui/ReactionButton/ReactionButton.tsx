import { FC, MouseEventHandler, ReactNode } from "react";
import classNames from "classnames";
import { Tooltip } from "../Tooltip";
import styles from "./ReactionButton.module.scss";

export type IReactionButtonVariant = "ghost" | "boxed";

interface IReactionButtonProps {
  icon: ReactNode;
  activeIcon?: ReactNode;
  label?: ReactNode;
  count?: number;
  isActive?: boolean;
  isReadOnly?: boolean;
  isDisabled?: boolean;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  ariaLabel?: string;
  tooltip?: ReactNode;
  variant?: IReactionButtonVariant;
  className?: string;
}

export const ReactionButton: FC<IReactionButtonProps> = ({
  icon,
  activeIcon,
  label,
  count,
  isActive,
  isReadOnly,
  isDisabled,
  onClick,
  ariaLabel,
  tooltip,
  variant = "ghost",
  className,
}) => {
  const classes = classNames(
    styles.reaction,
    styles[`reaction_${variant}`],
    className,
    {
      [styles.reaction_active]: isActive,
      [styles.reaction_readOnly]: isReadOnly,
    }
  );
  const content = (
    <>
      <span className={styles.reaction__icon}>
        {isActive && activeIcon ? activeIcon : icon}
      </span>
      {label}
      {count !== undefined && (
        <span className={styles.reaction__count}>{count}</span>
      )}
    </>
  );

  const element = isReadOnly ? (
    <span className={classes} aria-label={ariaLabel}>
      {content}
    </span>
  ) : (
    <button
      type="button"
      aria-pressed={!!isActive}
      aria-label={
        ariaLabel ?? (typeof tooltip === "string" ? tooltip : undefined)
      }
      disabled={isDisabled}
      className={classes}
      onClick={onClick}
    >
      {content}
    </button>
  );

  if (!tooltip) return element;

  return <Tooltip content={tooltip}>{element}</Tooltip>;
};
