import { FC } from "react";
import { Path, Svg } from "./Svg/Svg";
import { ICommonProps } from "../../types/common.type";

export const SvgDoubleArrow: FC<ICommonProps> = (props) => {
  return (
    <Svg {...props} size="24" viewBox="0 0 24 24">
      <Path d="M10.512 4.43a.75.75 0 0 0-.081 1.058L16.012 12l-5.581 6.512a.75.75 0 1 0 1.138.976l6-7a.75.75 0 0 0 0-.976l-6-7a.75.75 0 0 0-1.057-.081" />
      <Path
        defaultFillRule
        defaultClipRule
        d="M6.25 5a.75.75 0 0 1 1.32-.488l6 7a.75.75 0 0 1 0 .976l-6 7A.75.75 0 0 1 6.25 19z"
      />
    </Svg>
  );
};
