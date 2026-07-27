import { FC } from "react";
import { Path, Svg } from "./Svg/Svg";
import { ICommonProps } from "../../types/common.type";

export const SvgAdmin: FC<ICommonProps> = (props) => {
  return (
    <Svg {...props} size="24" viewBox="0 0 24 24">
      <Path
        defaultFillRule
        defaultClipRule
        d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12c5.16-1.26 9-6.45 9-12V5Zm0 3.9a3 3 0 1 1-3 3a3 3 0 0 1 3-3m0 7.9c2 0 6 1.09 6 3.08a7.2 7.2 0 0 1-12 0c0-1.99 4-3.08 6-3.08"
      />
    </Svg>
  );
};
