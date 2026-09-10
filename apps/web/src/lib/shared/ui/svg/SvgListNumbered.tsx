import { FC } from "react";
import { ISvgBaseProps, Path, Svg } from "./Svg/Svg";

export const SvgListNumbered: FC<ISvgBaseProps> = (props) => {
  return (
    <Svg {...props} viewBox="0 0 18 18">
      <Path
        type="stroke"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        defaultFillRule
        defaultClipRule
        d="M7 4.5h9M7 9h9M7 13.5h9M2 3.2h1v3M2 12h2v1.2l-2 .8V15h2"
      />
    </Svg>
  );
};
