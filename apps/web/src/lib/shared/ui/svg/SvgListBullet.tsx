import { FC } from "react";
import { ISvgBaseProps, Path, Svg } from "./Svg/Svg";

export const SvgListBullet: FC<ISvgBaseProps> = (props) => {
  return (
    <Svg {...props} viewBox="0 0 18 18">
      <Path
        type="stroke"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        defaultFillRule
        defaultClipRule
        d="M6 4.5h10M6 9h10M6 13.5h10M2.6 4.5h.01M2.6 9h.01M2.6 13.5h.01"
      />
    </Svg>
  );
};
