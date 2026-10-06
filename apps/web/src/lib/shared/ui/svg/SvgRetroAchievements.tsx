import { FC } from "react";
import { ISvgBaseProps, Path, Svg } from "./Svg/Svg";

export const SvgRetroAchievements: FC<ISvgBaseProps> = (props) => {
  return (
    <Svg viewBox="0 0 24 24" {...props}>
      <Path d="M7.6 14.9 6 22.5l3.2-1.4 2 1.9.8-4.2.8 4.2 2-1.9 3.2 1.4-1.6-7.6a8.4 8.4 0 0 1-8.8 0Z" />
      <circle cx="12" cy="9" r="8" fill="currentColor" />
      <text
        x="12"
        y="12.2"
        textAnchor="middle"
        fontSize="9"
        fontWeight="800"
        fontFamily="inherit"
        fill="var(--color-bg-primary)"
      >
        RA
      </text>
    </Svg>
  );
};
