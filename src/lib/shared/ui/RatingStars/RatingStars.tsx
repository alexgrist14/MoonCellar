import { FC } from "react";
import classNames from "classnames";
import styles from "./RatingStars.module.scss";
import { SvgMoon } from "../svg";

const STARS_COUNT = 10;

interface IRatingStarsProps {
  rating: number;
  className?: string;
}

export const RatingStars: FC<IRatingStarsProps> = ({ rating, className }) => {
  return (
    <div className={classNames(styles.stars, className)}>
      {Array.from({ length: STARS_COUNT }, (_, i) => (
        <SvgMoon
          key={i}
          size="16"
          className={styles.stars__star}
          fillPercent={(rating - i) * 100}
        />
      ))}
    </div>
  );
};
