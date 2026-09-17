import { FC } from "react";
import { ISvgBaseProps, Path, Svg } from "./Svg/Svg";

export const SvgGrip: FC<ISvgBaseProps> = (props) => {
  return (
    <Svg viewBox="0 0 24 24" {...props}>
      <Path
        defaultFillRule
        defaultClipRule
        d="M9 5.5a1.5 1.5 0 1 1-3 0a1.5 1.5 0 0 1 3 0m0 6.5a1.5 1.5 0 1 1-3 0a1.5 1.5 0 0 1 3 0m0 6.5a1.5 1.5 0 1 1-3 0a1.5 1.5 0 0 1 3 0m9-13a1.5 1.5 0 1 1-3 0a1.5 1.5 0 0 1 3 0m0 6.5a1.5 1.5 0 1 1-3 0a1.5 1.5 0 0 1 3 0m0 6.5a1.5 1.5 0 1 1-3 0a1.5 1.5 0 0 1 3 0"
      />
    </Svg>
  );
};
