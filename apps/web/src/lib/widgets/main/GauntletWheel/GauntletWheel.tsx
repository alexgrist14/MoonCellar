import { FC, useMemo } from "react";
import styles from "./GauntletWheel.module.scss";
import { generateWheelColors } from "@/src/lib/shared/utils/wheel.utils";
import { Path, Svg } from "@/src/lib/shared/ui/svg/Svg";

const SPOKES: [number, number][] = [
  [100, 2],
  [184.5, 50],
  [184.5, 150],
  [100, 198],
  [15.5, 150],
  [15.5, 50],
];

const SEGMENT_PATHS = SPOKES.map(([x1, y1], i) => {
  const [x2, y2] = SPOKES[(i + 1) % SPOKES.length];

  return `M100,100 L${x1},${y1} A98,98 0 0,1 ${x2},${y2} Z`;
});

export const GauntletWheel: FC = () => {
  const segColors = useMemo(
    () => generateWheelColors(SEGMENT_PATHS.length),
    []
  );

  return (
    <div className={styles.wheel}>
      <div className={styles.wheel__preview}>
        <div className={styles.wheel__container}>
          <Svg className={styles.wheel__svg} viewBox="0 0 200 200">
            <circle cx="100" cy="100" r="98" className={styles.wheel__rim} />
            {SEGMENT_PATHS.map((d, i) => (
              <Path key={d} d={d} color={segColors[i]} />
            ))}
            {SPOKES.map(([x, y]) => (
              <line
                key={`${x}-${y}`}
                x1="100"
                y1="100"
                x2={x}
                y2={y}
                className={styles.wheel__spoke}
              />
            ))}
            <circle cx="100" cy="100" r="28" className={styles.wheel__hub} />
            <text
              x="100"
              y="105"
              textAnchor="middle"
              fill="currentColor"
              fontFamily="Rajdhani"
              fontSize="14"
              fontWeight="600"
            >
              Spin
            </text>
          </Svg>
        </div>
      </div>
    </div>
  );
};
