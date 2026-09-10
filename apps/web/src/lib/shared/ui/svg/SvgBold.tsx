import { FC } from "react";
import { ISvgBaseProps, Path, Svg } from "./Svg/Svg";

export const SvgBold: FC<ISvgBaseProps> = (props) => {
  return (
    <Svg {...props} viewBox="0 0 18 18">
      <Path defaultFillRule defaultClipRule d="M4 2h5.2a3.3 3.3 0 0 1 0 6.6H4V2Zm0 6.6h5.8a3.4 3.4 0 0 1 0 6.8H4V8.6Z" />
    </Svg>
  );
};
