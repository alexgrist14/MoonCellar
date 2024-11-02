import React from "react";
import type { SVGProps } from "react";

export const SvgBan = (props: SVGProps<SVGSVGElement>) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="1em"
      height="1em"
      viewBox="0 0 24 24"
      {...props}
    >
      <path
        fill="currentColor"
        d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10s10-4.477 10-10S17.523 2 12 2M4 12a8 8 0 0 1 8-8c1.848 0 3.545.633 4.9 1.686L5.686 16.9A7.96 7.96 0 0 1 4 12m8 8a7.96 7.96 0 0 1-4.9-1.686L18.314 7.1A7.96 7.96 0 0 1 20 12a8 8 0 0 1-8 8"
      ></path>
    </svg>
  );
};
