import { FC } from "react";
import classNames from "classnames";
import { IReviewsSummary } from "@mooncellar/schemas";
import { commonUtils } from "@/src/lib/shared/utils/common.utils";
import styles from "@/src/lib/features/game/ui/GameCommunity/GameCommunity.module.scss";

export const ReviewsSummary: FC<{ summary: IReviewsSummary }> = ({
  summary,
}) => (
  <div className={styles.summary}>
    {summary.averageRating !== null && (
      <div className={styles.summary__score}>
        <span className={styles.summary__value}>
          {summary.averageRating}
          <span className={styles.summary__scale}> / 10</span>
        </span>
        <span className={styles.summary__label}>
          Average from {summary.ratedCount}{" "}
          {summary.ratedCount === 1 ? "player" : "players"}
        </span>
      </div>
    )}
    <div className={styles.distribution}>
      <div
        className={styles.distribution__bar}
        role="img"
        aria-label={summary.categories
          .map(({ category, count }) => `${commonUtils.upFL(category)} ${count}`)
          .join(", ")}
      >
        {summary.categories.map(({ category, count }) => (
          <i
            key={category}
            className={classNames(
              styles.distribution__segment,
              styles[`distribution__segment_${category}`]
            )}
            style={{ width: `${(count / summary.total) * 100}%` }}
          />
        ))}
      </div>
      <div className={styles.distribution__legend}>
        {summary.categories.map(({ category, count }) => (
          <span key={category} className={styles.distribution__item}>
            <i className={classNames(styles.dot, styles[`dot_${category}`])} />
            {commonUtils.upFL(category)} <b>{count}</b>
          </span>
        ))}
      </div>
    </div>
  </div>
);
