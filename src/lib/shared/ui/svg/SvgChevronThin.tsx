import { CSSProperties, FC } from "react";

export const SvgChevronThin: FC<{
  className?: string;
  pathStyle?: CSSProperties;
}> = ({ className, pathStyle }) => {
  return (
    <svg
      fill="#000000"
      width="800px"
      height="800px"
      viewBox="0 0 32 32"
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <title>chevron-right</title>
      <path
        style={pathStyle}
        d="M21.531 15.47l-10.001-10c-0.135-0.131-0.319-0.212-0.523-0.212-0.414 0-0.75 0.336-0.75 0.75 0 0.203 0.081 0.388 0.213 0.523l9.469 9.47-9.469 9.469c-0.135 0.136-0.218 0.323-0.218 0.529 0 0.415 0.336 0.751 0.751 0.751 0.206 0 0.393-0.083 0.528-0.218l10.001-10.001c0.135-0.136 0.218-0.323 0.218-0.53s-0.083-0.394-0.218-0.53l0 0z"
      ></path>
    </svg>
  );
};
