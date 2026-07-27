import { FC } from "react";
import { Svg } from "./Svg/Svg";
import { ICommonProps } from "../../types/common.type";

export const SvgGauntlet: FC<ICommonProps> = (props) => {
  return (
    <Svg {...props} viewBox="0 0 24 24">
      <circle
        cx="12"
        cy="12"
        r="9"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <line
        x1="12"
        y1="3"
        x2="12"
        y2="21"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <line
        x1="3"
        y1="12"
        x2="21"
        y2="12"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <line
        x1="5.636"
        y1="5.636"
        x2="18.364"
        y2="18.364"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <line
        x1="18.364"
        y1="5.636"
        x2="5.636"
        y2="18.364"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle cx="12" cy="12" r="2.5" fill="currentColor" />
    </Svg>
  );
};
