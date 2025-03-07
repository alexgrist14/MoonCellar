import React from "react";
import type { FC } from "react";

export const SvgArrow: FC<{ className?: string }> = ({ className }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      className={className}
    >
      <path
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M5 12h14M5 12l4-4m-4 4l4 4"
      />
    </svg>
  );
};
