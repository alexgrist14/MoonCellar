import { FC } from "react";
import { ISvgBaseProps, Path, Svg } from "./Svg/Svg";

export const SvgInfo: FC<ISvgBaseProps> = (props) => {
  return (
    <Svg {...props} viewBox="0 0 24 24">
      <Path
        type="stroke"
        defaultFillRule
        defaultClipRule
        strokeWidth="1.6"
        d="M12 20.5a8.5 8.5 0 1 0 0-17 8.5 8.5 0 0 0 0 17Z"
      />
      <Path
        type="stroke"
        defaultFillRule
        defaultClipRule
        strokeWidth="1.8"
        strokeLinecap="round"
        d="M12 11v5.5M12 7.75v.01"
      />
    </Svg>
  );
};
