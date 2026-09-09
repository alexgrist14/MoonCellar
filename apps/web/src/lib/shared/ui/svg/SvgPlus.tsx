import { FC } from "react";
import { ISvgBaseProps, Path, Svg } from "./Svg/Svg";

export const SvgPlus: FC<ISvgBaseProps> = ({ size = "16", ...props }) => {
  return (
    <Svg {...props} size={size} viewBox="0 0 24 24">
      <Path d="M12 3.25a.75.75 0 0 1 .75.75v7.25H20a.75.75 0 0 1 0 1.5h-7.25V20a.75.75 0 0 1-1.5 0v-7.25H4a.75.75 0 0 1 0-1.5h7.25V4a.75.75 0 0 1 .75-.75" />
    </Svg>
  );
};
