import { FC } from "react";

export const SvgCircleMenu: FC<{ className?: string; size?: number }> = ({
  className,
  size,
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 21 21"
      className={className}
    >
      <g fill="none" fillRule="evenodd" transform="translate(2 2)">
        <circle
          cx="8.5"
          cy="8.5"
          r="8"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1"
        />
        <path
          fill="currentColor"
          d="M8.5 9.5c.5 0 1-.5 1-1s-.5-1-1-1s-.999.5-.999 1s.499 1 .999 1m-4 0c.5 0 1-.5 1-1s-.5-1-1-1s-.999.5-.999 1s.499 1 .999 1m8 0c.5 0 1-.5 1-1s-.5-1-1-1s-.999.5-.999 1s.499 1 .999 1"
        />
      </g>
    </svg>
  );
};
