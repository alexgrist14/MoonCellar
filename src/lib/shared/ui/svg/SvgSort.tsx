import { Path, Svg } from "./Svg/Svg";
import { FCCLSC } from "../../types/common.type";

export const SvgSort: FCCLSC = (props) => {
  return (
    <Svg {...props} viewBox="0 0 24 24">
      <Path d="M12 4l5 6H7z" />
      <Path d="M12 20l-5-6h10z" />
    </Svg>
  );
};
