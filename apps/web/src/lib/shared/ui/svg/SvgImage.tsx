import { FC } from "react";
import { ISvgBaseProps, Path, Svg } from "./Svg/Svg";

export const SvgImage: FC<ISvgBaseProps> = (props) => {
  return (
    <Svg {...props} viewBox="0 0 18 18">
      <Path
        type="stroke"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        defaultFillRule
        defaultClipRule
        d="M2.5 3.5h13v11h-13v-11ZM2.5 11.5l3.6-3.2 3.1 2.7 2.4-2 3.9 3.4M7.5 6.6a1.1 1.1 0 1 1-2.2 0 1.1 1.1 0 0 1 2.2 0Z"
      />
    </Svg>
  );
};
