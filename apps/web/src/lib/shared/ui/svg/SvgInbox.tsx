import { FC } from "react";
import { ISvgBaseProps, Path, Svg } from "./Svg/Svg";

export const SvgInbox: FC<ISvgBaseProps> = (props) => {
  return (
    <Svg {...props} size="24" viewBox="0 0 24 24">
      <Path
        defaultFillRule
        defaultClipRule
        d="M19 3H4.99C3.88 3 3 3.9 3 5v14c0 1.1.88 2 1.99 2H19c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2m0 12h-4c0 1.66-1.35 3-3 3s-3-1.34-3-3H4.99V5H19z"
      />
    </Svg>
  );
};
