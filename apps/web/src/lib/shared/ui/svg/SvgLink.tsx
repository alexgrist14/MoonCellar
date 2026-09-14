import { FC } from "react";
import { ISvgBaseProps, Path, Svg } from "./Svg/Svg";

export const SvgLink: FC<ISvgBaseProps> = (props) => {
  return (
    <Svg {...props} viewBox="0 0 18 18">
      <Path
        type="stroke"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        defaultFillRule
        defaultClipRule
        d="M7.4 10.6a3.2 3.2 0 0 0 4.6 0l2.4-2.4a3.2 3.2 0 0 0-4.6-4.6l-1 1M10.6 7.4a3.2 3.2 0 0 0-4.6 0l-2.4 2.4a3.2 3.2 0 0 0 4.6 4.6l1-1"
      />
    </Svg>
  );
};
