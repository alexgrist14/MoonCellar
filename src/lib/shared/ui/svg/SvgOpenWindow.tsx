import { FC } from "react";
import { ISvgBaseProps, Svg, Path } from "./Svg/Svg";

export const SvgOpenWindow: FC<ISvgBaseProps> = (props) => {
  return (
    <Svg {...props} viewBox="0 0 24 24">
      <Path
        defaultFillRule
        defaultClipRule
        d="M5 3h6a1 1 0 1 1 0 2H5v14h14v-6a1 1 0 1 1 2 0v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"
      />
      <Path
        defaultFillRule
        defaultClipRule
        d="M14 3h7v7a1 1 0 1 1-2 0V6.41l-8.29 8.3a1 1 0 0 1-1.42-1.42L17.59 5H14a1 1 0 1 1 0-2z"
      />
    </Svg>
  );
};
