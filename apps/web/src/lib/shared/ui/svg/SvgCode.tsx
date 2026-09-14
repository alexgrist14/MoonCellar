import { FC } from "react";
import { ISvgBaseProps, Path, Svg } from "./Svg/Svg";

export const SvgCode: FC<ISvgBaseProps> = (props) => {
  return (
    <Svg {...props} viewBox="0 0 18 18">
      <Path
        type="stroke"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        defaultFillRule
        defaultClipRule
        d="m6 4-4 5 4 5M12 4l4 5-4 5"
      />
    </Svg>
  );
};
