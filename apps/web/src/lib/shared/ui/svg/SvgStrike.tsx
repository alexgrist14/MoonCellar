import { FC } from "react";
import { ISvgBaseProps, Path, Svg } from "./Svg/Svg";

export const SvgStrike: FC<ISvgBaseProps> = (props) => {
  return (
    <Svg {...props} viewBox="0 0 18 18">
      <Path
        type="stroke"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        defaultFillRule
        defaultClipRule
        d="M3 9h12M12.5 5.2C11.9 3.8 10.3 3 8.6 3 6.4 3 5 4.1 5 5.7c0 1.2.8 2 2.3 2.6M5.5 12c.5 1.5 2 2.4 3.8 2.4 2.2 0 3.7-1 3.7-2.7 0-.8-.3-1.4-.9-1.9"
      />
    </Svg>
  );
};
