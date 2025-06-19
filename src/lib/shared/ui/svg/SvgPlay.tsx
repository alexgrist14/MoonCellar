import { FC } from "react";

export const SvgPlay: FC<{ className?: string; size?: number }> = ({
  className,
  size,
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
    >
      <g
        fill="none"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="2"
      >
        <circle cx="12" cy="12" r="9" strokeLinecap="round" />
        <path d="m14 12l-3 1.732v-3.464z" />
      </g>
    </svg>
  );
};
