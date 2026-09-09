import { Svg } from "./Svg/Svg";
import { FCCLSC } from "../../types/common.type";

export const SvgSort: FCCLSC = (props) => {
  return (
    <Svg {...props} viewBox="0 0 24 24">
      <rect x="3" y="14" width="4" height="6" rx="1" fill="currentColor" />
      <rect x="10" y="9" width="4" height="11" rx="1" fill="currentColor" />
      <rect x="17" y="4" width="4" height="16" rx="1" fill="currentColor" />
    </Svg>
  );
};
