import { FC } from "react";
import { ISvgBaseProps, Svg } from "./Svg/Svg";

export const SvgResize: FC<ISvgBaseProps> = (props) => {
  return (
    <Svg {...props} size="24" viewBox="0 0 24 24">
      <rect
        x="15.9497"
        y="5.63599"
        width="2"
        height="16"
        rx="1"
        transform="rotate(45 15.9497 5.63599)"
        fill="white"
      />
      <rect
        x="16.4595"
        y="11.1262"
        width="2"
        height="8.95655"
        rx="1"
        transform="rotate(45 16.4595 11.1262)"
        fill="white"
      />
    </Svg>
  );
};
