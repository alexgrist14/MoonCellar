import { FC } from "react";
import { ISvgBaseProps, Path, Svg } from "./Svg/Svg";

export const SvgItalic: FC<ISvgBaseProps> = (props) => {
  return (
    <Svg {...props} viewBox="0 0 18 18">
      <Path
        type="stroke"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        defaultFillRule
        defaultClipRule
        d="M7 2h6M4 15h6M10.5 2 7.5 15"
      />
    </Svg>
  );
};
