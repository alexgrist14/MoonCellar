import { FC, useMemo } from "react";
import styles from "./GauntletWheel.module.scss";
import { generateWheelColors } from "../../../shared/utils/wheel.utils";

const SEGMENT_PATHS = [
  "M100,100 L100,2 A98,98 0 0,1 184.5,50 Z",
  "M100,100 L184.5,50 A98,98 0 0,1 184.5,150 Z",
  "M100,100 L184.5,150 A98,98 0 0,1 100,198 Z",
  "M100,100 L100,198 A98,98 0 0,1 15.5,150 Z",
  "M100,100 L15.5,150 A98,98 0 0,1 15.5,50 Z",
  "M100,100 L15.5,50 A98,98 0 0,1 100,2 Z",
];

export const GauntletWheel: FC = () => {
  const segColors = useMemo(
    () => generateWheelColors(SEGMENT_PATHS.length),
    []
  );

  return (
    <div className={styles.wheel}>
      <div className={styles.wheel__preview}>
        <div className={styles.wheel__container}>
          <svg className={styles.wheel__svg} viewBox="0 0 200 200">
            <circle
              cx="100"
              cy="100"
              r="98"
              fill="none"
              stroke="#374151"
              strokeWidth="2"
            />
            {SEGMENT_PATHS.map((d, i) => (
              <path key={d} d={d} fill={segColors[i]} />
            ))}
            <line
              x1="100"
              y1="100"
              x2="100"
              y2="2"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="1"
            />
            <line
              x1="100"
              y1="100"
              x2="184.5"
              y2="50"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="1"
            />
            <line
              x1="100"
              y1="100"
              x2="184.5"
              y2="150"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="1"
            />
            <line
              x1="100"
              y1="100"
              x2="100"
              y2="198"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="1"
            />
            <line
              x1="100"
              y1="100"
              x2="15.5"
              y2="150"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="1"
            />
            <line
              x1="100"
              y1="100"
              x2="15.5"
              y2="50"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="1"
            />
            <circle
              cx="100"
              cy="100"
              r="28"
              fill="#0d1117"
              stroke="#fff"
              strokeWidth="3"
            />
            <text
              x="100"
              y="105"
              textAnchor="middle"
              fill="#fff"
              fontFamily="Rajdhani"
              fontSize="14"
              fontWeight="600"
            >
              Spin
            </text>
          </svg>
        </div>
      </div>
    </div>
  );
};
