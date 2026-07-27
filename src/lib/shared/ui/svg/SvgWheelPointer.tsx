import { FC } from "react";
import { Path, Svg } from "./Svg/Svg";
import { ICommonProps } from "../../types/common.type";

const POINTER_PATH = "M0,0 L50,50 L0,100 Z";

export const SvgWheelPointer: FC<ICommonProps> = (props) => {
  return (
    <Svg {...props} viewBox="0 0 100 100" color="contrast">
      <Path d={POINTER_PATH} color="var(--color-neutral-5)" />
      <Path d={POINTER_PATH} type="stroke" strokeWidth={4} />
    </Svg>
  );
};
