import { Path, Svg } from "./Svg/Svg";
import { FCCLSC } from "@/src/lib/shared/types/common.type";

export const SvgThumb: FCCLSC = (props) => {
  return (
    <Svg viewBox="0 0 24 24" {...props}>
      <Path
        type="stroke"
        strokeWidth={1.8}
        strokeLinejoin="round"
        defaultFillRule
        defaultClipRule
        d="M7.5 10.5 11 3.8a2 2 0 0 1 2.7 1.9l-.5 3.8h5a2 2 0 0 1 2 2.4l-1.3 6.5a2 2 0 0 1-2 1.6H7.5Zm0 0H4.5v9h3"
      />
    </Svg>
  );
};
