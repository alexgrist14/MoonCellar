"use client";

import { FC } from "react";
import styles from "./ReleaseRail.module.scss";
import { IGameResponse } from "@mooncellar/schemas";
import { GameCard } from "@/src/lib/widgets/game/GameCard";
import { Scrollbar } from "@/src/lib/shared/ui/Scrollbar";
import { formatReleaseDate } from "@/src/lib/entities/game/model";

interface ReleaseRailProps {
  games: IGameResponse[];
  withDate?: boolean;
}

export const ReleaseRail: FC<ReleaseRailProps> = ({ games, withDate }) => {
  if (!games?.length) return null;

  return (
    <Scrollbar classNameContent={styles.rail} isHorizontal>
      {games.map((game) => {
        const date = withDate ? formatReleaseDate(game) : null;

        return (
          <div className={styles.rail__item} key={game._id}>
            <GameCard game={game} />
            {!!date && <span className={styles.rail__date}>{date}</span>}
          </div>
        );
      })}
    </Scrollbar>
  );
};
