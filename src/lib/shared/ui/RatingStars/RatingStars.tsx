import { FC } from "react";
import classNames from "classnames";
import styles from "./RatingStars.module.scss";
import { SvgStar } from "../svg";
import { ISvgSizes } from "../../types/common.type";
import { Tooltip } from "../Tooltip";

const STARS_COUNT = 10;

interface IRatingStarsProps {
  rating: number;
  className?: string;
  size?: ISvgSizes;
}

export const RatingStars: FC<IRatingStarsProps> = ({
  rating,
  className,
  size = "16",
}) => {
  return (
    <Tooltip content={rating}>
      <div className={classNames(styles.stars, className)}>
        {Array.from({ length: STARS_COUNT }, (_, i) => (
          <SvgStar
            key={i}
            size={size}
            className={styles.stars__star}
            fillPercent={(rating - i) * 100}
          />
        ))}
      </div>
    </Tooltip>
  );
};
