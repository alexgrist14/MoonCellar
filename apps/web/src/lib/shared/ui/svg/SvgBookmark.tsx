import { FC } from "react";
import { ISvgBaseProps, Path, Svg } from "./Svg/Svg";

export const SvgBookmark: FC<ISvgBaseProps> = (props) => {
  return (
    <Svg viewBox="0 0 24 24" {...props}>
      <Path
        type="stroke"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        defaultFillRule
        defaultClipRule
        d="M6.5 3.5h11v17l-5.5-4-5.5 4z"
      />
    </Svg>
  );
};
