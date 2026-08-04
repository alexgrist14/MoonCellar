import { FC } from "react";
import { ISvgBaseProps, Svg } from "./Svg/Svg";

interface ISvgNumberProps extends ISvgBaseProps {
  value: number;
  onClick?: () => void;
  onMouseOver?: () => void;
}

export const SvgNumber: FC<ISvgNumberProps> = ({ value, ...props }) => {
  return (
    <Svg viewBox="0 0 24 24" {...props}>
      <text
        x="12"
        y="12.5"
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="14"
        fontWeight="700"
        fill="currentColor"
      >
        {value}
      </text>
    </Svg>
  );
};
