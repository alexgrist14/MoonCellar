import { FC } from "react";
import { ISvgBaseProps, Svg } from "./Svg/Svg";

export const SvgVideoPlay: FC<ISvgBaseProps> = (props) => {
  return (
    <Svg {...props} viewBox="0 0 24 24">
      <rect x="1" y="4" width="22" height="16" rx="4" fill="currentColor" />
      <polygon points="10,8 17,12 10,16" fill="var(--color-bg-primary)" />
    </Svg>
  );
};
