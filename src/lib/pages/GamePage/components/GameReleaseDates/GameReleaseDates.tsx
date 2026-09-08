"use client";

import { FC, useMemo } from "react";
import styles from "./GameReleaseDates.module.scss";
import { Box } from "@/src/lib/shared/ui/Box";
import { dateRegions } from "@/src/lib/shared/constants";
import { IGameResponse } from "@/src/lib/shared/lib/schemas/games.schema";
import { useCommonStore } from "@/src/lib/shared/store/common.store";

interface IGameReleaseDatesProps {
  game: IGameResponse;
  className?: string;
}

export const GameReleaseDates: FC<IGameReleaseDatesProps> = ({
  game,
  className,
}) => {
  const { systems } = useCommonStore();

  const dates = useMemo(
    () => (game.release_dates || []).toSorted((a, b) => a.date - b.date),
    [game.release_dates]
  );

  if (!dates.length) return null;

  return (
    <Box
      title="Release dates"
      isTitleStart
      className={className}
      wrapperStyle={{ height: "auto" }}
      templateStyle={{ height: "100%" }}
      classNameContent={styles.dates}
    >
      {dates.map((date, i) => {
        const platform = systems?.find((sys) => sys._id === date.platformId);

        return (
          <p key={date.date + "_" + i}>
            {date.human}: {platform?.name || "Unknown platform"}
            {!!dateRegions[+date.region - 1] && (
              <span> ({dateRegions[+date.region - 1]})</span>
            )}
          </p>
        );
      })}
    </Box>
  );
};
