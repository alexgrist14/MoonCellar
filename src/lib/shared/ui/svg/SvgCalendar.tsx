import { FC } from "react";
import { ISvgBaseProps, Path, Svg } from "./Svg/Svg";

export const SvgCalendar: FC<ISvgBaseProps> = (props) => {
  return (
    <Svg {...props} viewBox="0 0 24 24">
      <Path
        type="stroke"
        defaultFillRule
        defaultClipRule
        strokeWidth="1.6"
        strokeLinecap="round"
        d="M6.5 5.5h11a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3h-11a3 3 0 0 1-3-3v-9a3 3 0 0 1 3-3Z"
      />
      <Path
        type="stroke"
        defaultFillRule
        defaultClipRule
        strokeWidth="1.6"
        strokeLinecap="round"
        d="M3.5 10h17M8 3.5v4M16 3.5v4"
      />
    </Svg>
  );
};
