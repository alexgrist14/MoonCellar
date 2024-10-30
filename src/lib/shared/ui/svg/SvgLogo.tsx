import { FC } from "react";

export const SvgLogo: FC<{ className?: string }> = ({ className }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="1em"
      height="1em"
      viewBox="0 0 256 256"
      className={className}
    >
      <defs>
        <radialGradient
          id="logosMoon0"
          cx="50%"
          cy="50%"
          r="49.789%"
          fx="50%"
          fy="50%"
        >
          <stop offset="0%" stopColor="#4600d1"></stop>
          <stop offset="49.285%" stopColor="#4600d1"></stop>
          <stop offset="100%" stopColor="#35009f"></stop>
        </radialGradient>
        <radialGradient
          id="logosMoon1"
          cx="50%"
          cy="50%"
          r="49.603%"
          fx="50%"
          fy="50%"
        >
          <stop offset="0%" stopColor="#35019e"></stop>
          <stop offset="18.73%" stopColor="#320194"></stop>
          <stop offset="100%" stopColor="#206"></stop>
        </radialGradient>
        <circle id="logosMoon2" cx={128} cy={128} r={128}></circle>
      </defs>
      <circle cx={128} cy={128} r={128} fill="#5805ff"></circle>
      <mask id="logosMoon3" fill="#fff">
        <use href="#logosMoon2"></use>
      </mask>
      <circle
        cx={199.694}
        cy={105.369}
        r={128}
        fill="url(#logosMoon0)"
        mask="url(#logosMoon3)"
      ></circle>
      <circle
        cx={275.372}
        cy={82.376}
        r={128}
        fill="url(#logosMoon1)"
        mask="url(#logosMoon3)"
      ></circle>
    </svg>
  );
};
