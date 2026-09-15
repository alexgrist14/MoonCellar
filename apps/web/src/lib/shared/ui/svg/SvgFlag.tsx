import { Path, Svg } from "./Svg/Svg";
import { FCCLSC } from "../../types/common.type";

export const SvgFlag: FCCLSC = (props) => {
  return (
    <Svg viewBox="0 0 24 24" {...props}>
      <Path
        type="stroke"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        defaultFillRule
        defaultClipRule
        d="M5.5 21V4.5m0 0h11l-2 4 2 4h-11"
      />
    </Svg>
  );
};
