import { FC } from "react";
import { ISvgBaseProps, Path, Svg } from "./Svg/Svg";

const HEART_PATH =
  "M12 20.5s-7.5-4.6-7.5-10.1A4.4 4.4 0 0 1 12 7.6a4.4 4.4 0 0 1 7.5 2.8c0 5.5-7.5 10.1-7.5 10.1Z";

export const SvgHeartFilled: FC<ISvgBaseProps> = (props) => {
  return (
    <Svg viewBox="0 0 24 24" {...props}>
      <Path defaultFillRule defaultClipRule d={HEART_PATH} />
      <Path
        type="stroke"
        strokeWidth={1.8}
        strokeLinejoin="round"
        defaultFillRule
        defaultClipRule
        d={HEART_PATH}
      />
    </Svg>
  );
};
