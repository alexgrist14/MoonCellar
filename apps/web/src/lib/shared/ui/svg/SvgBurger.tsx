import { FC } from "react";
import cn from "classnames";
import { ISvgBaseProps, Path, Svg } from "./Svg/Svg";
import styles from "./SvgBurger.module.scss";

interface ISvgBurgerProps extends ISvgBaseProps {
  isOpen?: boolean;
  topId?: string;
  middleId?: string;
  bottomId?: string;
}

export const SvgBurger: FC<ISvgBurgerProps> = ({
  isOpen,
  topId,
  middleId,
  bottomId,
  className,
  ...props
}) => {
  return (
    <Svg
      {...props}
      className={cn(styles.burger, isOpen && styles.burger_open, className)}
      id="hamburger"
      viewBox="0 0 60 40"
    >
      <g
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <Path
          defaultFillRule
          type="stroke"
          className={cn(styles.burger__line, styles.burger__top, topId)}
          d="M10,10 L50,10 Z"
        />
        <Path
          defaultFillRule
          type="stroke"
          className={cn(styles.burger__line, styles.burger__middle, middleId)}
          d="M10,20 L50,20 Z"
        />
        <Path
          defaultFillRule
          type="stroke"
          className={cn(styles.burger__line, styles.burger__bottom, bottomId)}
          d="M10,30 L50,30 Z"
        />
      </g>
    </Svg>
  );
};
