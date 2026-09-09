import { FC, useId } from "react";
import { ISvgBaseProps, Path, Svg } from "./Svg/Svg";

const MOON_PATH =
  "M18.228 19.47c0 7.669 6.216 13.885 13.884 13.885c1.121 0 2.21-.133 3.254-.383c.81-.195 1.595.54 1.271 1.31C33.987 40.578 27.76 45 20.5 45C10.835 45 3 37.165 3 27.5S10.835 10 20.5 10c.571 0 .849.68.506 1.138a13.82 13.82 0 0 0-2.778 8.333Zm20.096 7.934c-.261.795-1.386.795-1.648 0l-1.615-4.912a.87.87 0 0 0-.553-.553l-4.912-1.615c-.795-.262-.795-1.387 0-1.648l4.912-1.615a.87.87 0 0 0 .553-.553l1.615-4.912c.261-.795 1.386-.795 1.648 0l1.615 4.912a.87.87 0 0 0 .553.553l4.912 1.615c.795.262.795 1.387 0 1.648l-4.912 1.615a.87.87 0 0 0-.553.553zM29 4v6m3-3h-6";

interface ISvgMoonProps extends ISvgBaseProps {
  fillPercent?: number;
}

export const SvgMoon: FC<ISvgMoonProps> = ({ fillPercent = 0, ...props }) => {
  const clipId = useId();
  const fill = Math.min(100, Math.max(0, fillPercent));

  return (
    <Svg {...props} viewBox="0 0 48 48" color="secondary">
      <defs>
        <clipPath id={clipId}>
          <rect x="0" y="0" width={`${fill}%`} height="48" />
        </clipPath>
      </defs>
      <Path
        d={MOON_PATH}
        type="stroke"
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d={MOON_PATH}
        type="stroke"
        color="var(--color-accent)"
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
        clipPath={`url(#${clipId})`}
      />
    </Svg>
  );
};
