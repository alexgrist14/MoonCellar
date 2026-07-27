import { FC, useRef, useState } from "react";
import classNames from "classnames";
import styles from "./RatingStars.module.scss";
import { SvgMoon } from "../svg";
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
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [isHover, setIsHover] = useState(false);

  return (
    <div
      ref={wrapperRef}
      className={classNames(styles.stars, className)}
      onMouseEnter={() => setIsHover(true)}
      onMouseLeave={() => setIsHover(false)}
    >
      {Array.from({ length: STARS_COUNT }, (_, i) => (
        <SvgMoon
          key={i}
          size={size}
          className={styles.stars__star}
          fillPercent={(rating - i) * 100}
        />
      ))}
      <Tooltip positionRef={wrapperRef} isActive={isHover}>
        {rating}
      </Tooltip>
    </div>
  );
};
