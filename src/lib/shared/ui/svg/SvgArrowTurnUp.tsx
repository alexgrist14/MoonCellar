import { CSSProperties, FC } from "react";

export const SvgArrowTurnUp: FC<{
  className?: string;
  style?: CSSProperties;
}> = ({ className, style }) => {
  return (
    <svg
      style={style}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      height="16"
      width="12"
      viewBox="0 0 384 512"
    >
      <path d="M32 448c-17.7 0-32 14.3-32 32s14.3 32 32 32l96 0c53 0 96-43 96-96l0-306.7 73.4 73.4c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3l-128-128c-12.5-12.5-32.8-12.5-45.3 0l-128 128c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L160 109.3 160 416c0 17.7-14.3 32-32 32l-96 0z" />
    </svg>
  );
};
