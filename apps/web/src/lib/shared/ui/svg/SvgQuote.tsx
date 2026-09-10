import { FC } from "react";
import { ISvgBaseProps, Path, Svg } from "./Svg/Svg";

export const SvgQuote: FC<ISvgBaseProps> = (props) => {
  return (
    <Svg {...props} viewBox="0 0 18 18">
      <Path defaultFillRule defaultClipRule d="M7 4.5C5 5.4 4 6.9 4 9v4.5h4.5V9H6.2c0-1.4.3-2.4 1.6-3.1L7 4.5Zm7.5 0c-2 .9-3 2.4-3 4.5v4.5H16V9h-2.3c0-1.4.3-2.4 1.6-3.1l-.8-1.4Z" />
    </Svg>
  );
};
