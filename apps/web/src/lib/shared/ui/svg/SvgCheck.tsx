import { FC } from "react";
import { ISvgBaseProps, Path, Svg } from "./Svg/Svg";

export const SvgCheck: FC<ISvgBaseProps> = (props) => {
  return (
    <Svg viewBox="0 0 24 24" {...props}>
      <Path
        type="stroke"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        defaultFillRule
        defaultClipRule
        d="M5 12.5l4.5 4.5L19 7.5"
      />
    </Svg>
  );
};
