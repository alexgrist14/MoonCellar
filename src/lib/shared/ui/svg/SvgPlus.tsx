import { FC } from "react";

export const SvgPlus: FC<{ className?: string; size?: number }> = ({
  className,
  size,
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size || "16"}
      height={size || "16"}
      viewBox={`0 0 24 24`}
      className={className}
    >
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M12 3.25a.75.75 0 0 1 .75.75v7.25H20a.75.75 0 0 1 0 1.5h-7.25V20a.75.75 0 0 1-1.5 0v-7.25H4a.75.75 0 0 1 0-1.5h7.25V4a.75.75 0 0 1 .75-.75"
        clipRule="evenodd"
      />
    </svg>
  );
};
