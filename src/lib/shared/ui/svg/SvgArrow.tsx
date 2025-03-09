import type { CSSProperties, FC } from "react";

export const SvgArrow: FC<{
  className?: string;
  style?: CSSProperties;
}> = ({ className, style }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      className={className}
      style={style}
    >
      <path
        fill="currentColor"
        d="M15.835 11.63L9.205 5.2C8.79 4.799 8 5.042 8 5.57v12.86c0 .528.79.771 1.205.37l6.63-6.43a.5.5 0 0 0 0-.74"
      />
    </svg>
  );
};
