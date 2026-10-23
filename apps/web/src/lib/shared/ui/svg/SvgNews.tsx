import { FC } from "react";
import { ISvgBaseProps, Path, Svg } from "./Svg/Svg";

export const SvgNews: FC<ISvgBaseProps> = (props) => {
  return (
    <Svg {...props} viewBox="0 0 24 24">
      <Path
        type="stroke"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        defaultFillRule
        defaultClipRule
        d="M5 4.5h10.5V18a2 2 0 0 0 2 2H6a2 2 0 0 1-2-2V5.5a1 1 0 0 1 1-1Zm10.5 5H19V18a2 2 0 0 1-4 0M7.5 8.5H12M7.5 12H12M7.5 15.5h3"
      />
    </Svg>
  );
};
