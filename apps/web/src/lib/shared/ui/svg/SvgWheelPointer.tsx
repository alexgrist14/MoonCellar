import { FC } from "react";
import { ISvgBaseProps, Path, Svg } from "./Svg/Svg";

const POINTER_PATH = "M100,25 L50,50 L100,75 A100,100 0 0 0 100,25 Z";

export const SvgWheelPointer: FC<ISvgBaseProps> = (props) => {
  return (
    <Svg {...props} viewBox="-6 -6 112 112" color="contrast">
      <Path d={POINTER_PATH} color="var(--color-contrast)" />
      <Path
        d={POINTER_PATH}
        type="stroke"
        strokeWidth={4}
        strokeLinejoin="round"
        color="var(--color-contrast-reverse)"
      />
    </Svg>
  );
};
