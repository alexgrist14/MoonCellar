import { FC } from "react";
import { Path, Svg } from "./Svg/Svg";
import { ICommonProps } from "../../types/common.type";

interface ISvgBurgerProps extends ICommonProps {
  topId?: string;
  middleId?: string;
  bottomId?: string;
}

export const SvgBurger: FC<ISvgBurgerProps> = ({
  topId,
  middleId,
  bottomId,
  ...props
}) => {
  return (
    <Svg {...props} id="hamburger" viewBox="0 0 60 40">
      <g
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <Path
          defaultFillRule
          type="stroke"
          className={topId}
          d="M10,10 L50,10 Z"
        />
        <Path
          defaultFillRule
          type="stroke"
          className={middleId}
          d="M10,20 L50,20 Z"
        />
        <Path
          defaultFillRule
          type="stroke"
          className={bottomId}
          d="M10,30 L50,30 Z"
        />
      </g>
    </Svg>
  );
};
