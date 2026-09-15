import { Path, Svg } from "./Svg/Svg";
import { FCCLSC } from "../../types/common.type";

export const SvgEye: FCCLSC = (props) => {
  return (
    <Svg viewBox="0 0 24 24" {...props}>
      <Path
        type="stroke"
        strokeWidth={1.8}
        strokeLinejoin="round"
        defaultFillRule
        defaultClipRule
        d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12ZM12 9.2a2.8 2.8 0 1 0 0 5.6 2.8 2.8 0 0 0 0-5.6Z"
      />
    </Svg>
  );
};
