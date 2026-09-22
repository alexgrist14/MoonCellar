import { Path, Svg } from "./Svg/Svg";
import { FCCLSC } from "@/src/lib/shared/types/common.type";

export const SvgReply: FCCLSC = (props) => {
  return (
    <Svg viewBox="0 0 24 24" {...props}>
      <Path
        type="stroke"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        defaultFillRule
        defaultClipRule
        d="M10 8 5 12.5 10 17M5.5 12.5H14a5 5 0 0 1 5 5V19"
      />
    </Svg>
  );
};
