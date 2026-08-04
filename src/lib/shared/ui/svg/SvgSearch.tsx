import { FC } from "react";
import { ISvgBaseProps, Path, Svg } from "./Svg/Svg";

export const SvgSearch: FC<ISvgBaseProps> = (props) => {
  return (
    <Svg {...props} size="24" viewBox="0 0 24 24">
      <Path
        type="stroke"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M3 10a7 7 0 1 0 14 0a7 7 0 1 0-14 0m18 11l-6-6"
      />
    </Svg>
  );
};
