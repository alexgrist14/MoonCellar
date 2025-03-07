import React from "react";
import type { FC } from "react";

export const SvgBurger: FC<{
  className?: string;
  topId?: string;
  middleId?: string;
  bottomId?: string;
}> = ({ className,topId,middleId,bottomId }) => {
  return (
    <svg id="hamburger" className={className} viewBox="0 0 60 40">
      <g
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path className={topId} d="M10,10 L50,10 Z"></path>
        <path className={middleId} d="M10,20 L50,20 Z"></path>
        <path className={bottomId} d="M10,30 L50,30 Z"></path>
      </g>
    </svg>
  );
};
