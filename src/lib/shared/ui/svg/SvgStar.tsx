import { FC, useId } from "react";
import { ISvgBaseProps, Path, Svg } from "./Svg/Svg";

const STAR_PATH =
  "M10.92 2.868a1.25 1.25 0 0 1 2.16 0l2.795 4.798l5.428 1.176a1.25 1.25 0 0 1 .667 2.054l-3.7 4.141l.56 5.525a1.25 1.25 0 0 1-1.748 1.27L12 19.592l-5.082 2.24a1.25 1.25 0 0 1-1.748-1.27l.56-5.525l-3.7-4.14a1.25 1.25 0 0 1 .667-2.055l5.428-1.176zM12 4.987L9.687 8.959a1.25 1.25 0 0 1-.816.592l-4.492.973l3.062 3.427c.234.262.347.61.312.959l-.463 4.573l4.206-1.854a1.25 1.25 0 0 1 1.008 0l4.206 1.854l-.463-4.573a1.25 1.25 0 0 1 .311-.959l3.063-3.427l-4.492-.973a1.25 1.25 0 0 1-.816-.592z";

interface ISvgStarProps extends ISvgBaseProps {
  fillPercent?: number;
}

export const SvgStar: FC<ISvgStarProps> = ({ fillPercent = 0, ...props }) => {
  const clipId = useId();
  const fill = Math.min(100, Math.max(0, fillPercent));

  return (
    <Svg {...props} viewBox="0 0 24 24" color="secondary">
      <defs>
        <clipPath id={clipId}>
          <rect x="0" y="0" width={`${fill}%`} height="24" />
        </clipPath>
      </defs>
      <Path d={STAR_PATH} />
      <Path
        d={STAR_PATH}
        color="var(--color-accent)"
        clipPath={`url(#${clipId})`}
      />
    </Svg>
  );
};
