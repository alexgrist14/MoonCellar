import { FC } from "react";
import { ISvgBaseProps, Path, Svg } from "./Svg/Svg";

export const SvgLock: FC<ISvgBaseProps> = (props) => {
  return (
    <Svg viewBox="0 0 24 24" {...props}>
      <Path
        type="stroke"
        strokeWidth={1.8}
        strokeLinejoin="round"
        strokeLinecap="round"
        defaultFillRule
        defaultClipRule
        d="M6.5 10.5h11a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1Zm2.5 0V7.5a3 3 0 0 1 6 0v3"
      />
    </Svg>
  );
};
