import { Path, Svg } from "./Svg/Svg";
import { FCCLSC } from "../../types/common.type";

export const SvgMore: FCCLSC = (props) => {
  return (
    <Svg {...props} viewBox="0 0 16 16">
      <Path d="M3 9.5a1.5 1.5 0 1 1 0-3a1.5 1.5 0 0 1 0 3m5 0a1.5 1.5 0 1 1 0-3a1.5 1.5 0 0 1 0 3m5 0a1.5 1.5 0 1 1 0-3a1.5 1.5 0 0 1 0 3" />
    </Svg>
  );
};
