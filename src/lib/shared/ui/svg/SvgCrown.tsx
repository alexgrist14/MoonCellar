import { Path, Svg } from "./Svg/Svg";
import { FCCLSC } from "../../types/common.type";

export const SvgCrown: FCCLSC = (props) => {
  return (
    <Svg {...props} viewBox="0 0 24 24">
      <Path
        defaultFillRule
        defaultClipRule
        d="M2.4 6.6a1.3 1.3 0 0 1 1.98.28L6.9 10.5l3.98-5.6a1.37 1.37 0 0 1 2.24 0l3.98 5.6 2.52-3.62A1.3 1.3 0 0 1 21.6 6.6c.5.31.73.92.56 1.48l-2.5 8.32H4.34l-2.5-8.32c-.17-.56.06-1.17.56-1.48Z"
      />
      <Path
        defaultFillRule
        defaultClipRule
        d="M4.6 18.1h14.8a.9.9 0 0 1 0 1.8H4.6a.9.9 0 0 1 0-1.8Z"
      />
    </Svg>
  );
};
