import {
  CSSProperties,
  FC,
  HTMLAttributes,
  MouseEvent,
  ReactNode,
} from "react";
import classNames from "classnames";
import styles from "./StatTile.module.scss";

interface IStatTileProps extends Omit<
  HTMLAttributes<HTMLElement>,
  "onClick" | "children"
> {
  label?: ReactNode;
  value: ReactNode;
  hint?: ReactNode;
  children?: ReactNode;
  valueColor?: string;
  align?: "start" | "center";
  isLabelBelow?: boolean;
  isCompact?: boolean;
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
}

export const StatTile: FC<IStatTileProps> = ({
  label,
  value,
  hint,
  children,
  valueColor,
  align = "start",
  isLabelBelow,
  isCompact,
  onClick,
  className,
  style,
  ...rest
}) => {
  const tileClassName = classNames(
    styles.tile,
    styles[`tile_${align}`],
    {
      [styles.tile_labelBelow]: isLabelBelow,
      [styles.tile_compact]: isCompact,
      [styles.tile_interactive]: !!onClick,
    },
    className
  );

  const tileStyle = valueColor
    ? ({ ...style, "--stat-tile-value-color": valueColor } as CSSProperties)
    : style;

  const content = (
    <>
      {!!label && <span className={styles.tile__label}>{label}</span>}
      <span className={styles.tile__value}>
        <span>{value}</span>
        {children}
      </span>
      {!!hint && <span className={styles.tile__hint}>{hint}</span>}
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        className={tileClassName}
        style={tileStyle}
        onClick={onClick}
        {...rest}
      >
        {content}
      </button>
    );
  }

  return (
    <div className={tileClassName} style={tileStyle} {...rest}>
      {content}
    </div>
  );
};
