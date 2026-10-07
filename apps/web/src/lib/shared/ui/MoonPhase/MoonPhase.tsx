import { FC } from "react";
import classNames from "classnames";
import { Path, Svg } from "@/src/lib/shared/ui/svg/Svg";
import { ISvgSizes } from "@/src/lib/shared/types/common.type";
import { getMoonLitPath } from "@/src/lib/shared/utils/moon.utils";
import styles from "./MoonPhase.module.scss";

const RADIUS = 10;

interface IMoonPhaseProps {
  phase?: number;
  size?: ISvgSizes;
  label?: string;
  isHighlighted?: boolean;
  className?: string;
}

export const MoonPhase: FC<IMoonPhaseProps> = ({
  phase,
  size = "20",
  label,
  isHighlighted,
  className,
}) => (
  <span
    className={classNames(
      styles.moon,
      isHighlighted && styles.moon_highlighted,
      className
    )}
    role={label ? "img" : undefined}
    aria-label={label}
    aria-hidden={label ? undefined : true}
  >
    <Svg size={size} viewBox="-11 -11 22 22">
      {phase === undefined ? (
        <circle r={RADIUS} className={styles.moon__unknown} />
      ) : (
        <>
          <circle r={RADIUS} className={styles.moon__dark} />
          <Path
            d={getMoonLitPath(phase, RADIUS)}
            className={styles.moon__lit}
          />
        </>
      )}
    </Svg>
  </span>
);
