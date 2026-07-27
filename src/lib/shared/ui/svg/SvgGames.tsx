import { FC } from "react";
import { Svg } from "./Svg/Svg";
import { ICommonProps } from "../../types/common.type";

export const SvgGames: FC<ICommonProps> = (props) => {
  return (
    <Svg {...props} viewBox="0 0 24 24">
      <rect x="6" y="18" width="12" height="3" rx="1.5" fill="currentColor" />
      <rect x="10.5" y="8" width="3" height="10" rx="1.5" fill="currentColor" />
      <circle cx="12" cy="6" r="4" fill="currentColor" />
    </Svg>
  );
};
