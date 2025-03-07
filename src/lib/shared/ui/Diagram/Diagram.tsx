import { FC, useEffect, useRef, useState } from "react";
import styles from "./Diagram.module.scss";

interface DiagramProps {
  data: {
    [key: string]: number;
  };
}
export const Diagram: FC<DiagramProps> = ({ data }) => {
  const maxValue = Math.max(...Object.values(data));
  const barRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [barWidths, setBarWidths] = useState<number[]>([]);

  useEffect(() => {
    const widths = barRefs.current.map(
      (ref) => ref?.getBoundingClientRect().width || 0
    );
    setBarWidths(widths);
  }, [data]);

  return (
    <div className={styles.container}>
      {Object.entries(data).map(([key, value], i) => {
        const barWidth = (value / maxValue) * 100;
        return value ? (
          <div key={key + value} className={styles.bar__container}>
            <div
              ref={(el) => (barRefs.current[i] = el)}
              className={styles.bar}
              style={{
                width: `${barWidth}%`,
              }}
            >
              {barWidths[i] >= 15 ? value : null}
            </div>
            <span className={styles.label}>{key}</span>
          </div>
        ) : null;
      })}
    </div>
  );
};
