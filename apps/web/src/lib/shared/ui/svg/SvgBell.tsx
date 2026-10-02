import { FC } from "react";
import { ISvgBaseProps, Path, Svg } from "./Svg/Svg";

export const SvgBell: FC<ISvgBaseProps> = (props) => {
  return (
    <Svg {...props} viewBox="0 0 24 24">
      <Path
        type="stroke"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M10 5a2 2 0 1 1 4 0a7 7 0 0 1 4 6v3a4 4 0 0 0 2 3H4a4 4 0 0 0 2-3v-3a7 7 0 0 1 4-6M9 17v1a3 3 0 0 0 6 0v-1"
      />
    </Svg>
  );
};
