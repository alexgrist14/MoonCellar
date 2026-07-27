import { Path, Svg } from "./Svg/Svg";
import { FCCLSC } from "../../types/common.type";

export const SvgComment: FCCLSC = (props) => {
  return (
    <Svg viewBox="0 0 24 24" {...props}>
      <Path d="M4 4h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H9l-4 4v-4H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
    </Svg>
  );
};
