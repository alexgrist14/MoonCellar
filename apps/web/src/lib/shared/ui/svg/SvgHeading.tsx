import { FC } from "react";
import { ISvgBaseProps, Path, Svg } from "./Svg/Svg";

export const SvgHeading: FC<ISvgBaseProps> = (props) => {
  return (
    <Svg {...props} viewBox="0 0 18 18">
      <Path
        type="stroke"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        defaultFillRule
        defaultClipRule
        d="M2 3v12M8 3v12M2 9h6M11.5 4.5h4l-2.4 3.2A2.6 2.6 0 1 1 11 11.8"
      />
    </Svg>
  );
};
