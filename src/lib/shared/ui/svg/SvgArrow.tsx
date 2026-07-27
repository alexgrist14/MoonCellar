import { FC } from "react";
import { Path, Svg } from "./Svg/Svg";
import { ICommonProps } from "../../types/common.type";

export const SvgArrow: FC<ICommonProps> = (props) => {
  return (
    <Svg {...props} size="24" viewBox="0 0 24 24">
      <Path
        defaultFillRule
        defaultClipRule
        d="M15.835 11.63L9.205 5.2C8.79 4.799 8 5.042 8 5.57v12.86c0 .528.79.771 1.205.37l6.63-6.43a.5.5 0 0 0 0-.74"
      />
    </Svg>
  );
};
