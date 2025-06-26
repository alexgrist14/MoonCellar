import { FC, ReactNode, useMemo, useRef } from "react";
import styles from "./GameCardInfo.module.scss";
import classNames from "classnames";
import Link from "next/link";
import { IGDBGameMinimal } from "@/src/lib/shared/types/igdb";
import { useUserStore } from "@/src/lib/shared/store/user.store";
import { commonUtils } from "@/src/lib/shared/utils/common";
import { gameCategories, gameCategoryNames } from "@/src/lib/shared/constants";

interface IGameCardInfoProps {
  bottomNode: ReactNode;
  game: IGDBGameMinimal;
}

export const GameCardInfo: FC<IGameCardInfoProps> = ({ bottomNode, game }) => {
  const infoRef = useRef<HTMLDivElement>(null);
  const { playthroughs } = useUserStore();

  const playthroughsCount = useMemo(() => {
    return playthroughs?.filter((play) => play.gameId === game._id).length;
  }, [playthroughs, game]);

  return (
    <div className={classNames(styles.info)}>
      <Link
        draggable={false}
        className={styles.info__title}
        href={`/games/${game.slug}`}
      >
        <div className={styles.info__top}>
          <p>{game.name}</p>
          {!!playthroughsCount && playthroughsCount > 1 && (
            <span>
              ( {playthroughsCount}{" "}
              {commonUtils.addLastS("Playthrough", playthroughsCount)} )
            </span>
          )}
          {!!game.summary && (infoRef.current?.clientHeight || 0) >= 140 && (
            <span>{game.summary}</span>
          )}
        </div>
        <span className={styles.info__category}>
          {`${
            gameCategoryNames[
              Object.keys(gameCategories).find(
                (key) => gameCategories[key] === game.category
              ) || ""
            ]
          }`}
          {!!game.first_release_date
            ? ` - ${new Date(game.first_release_date * 1000).getFullYear()}`
            : ""}
        </span>
        <span className={styles.info__platforms}>
          {!!game.platforms?.length &&
            game.platforms.map((platform) => platform.name).join(", ")}
        </span>
      </Link>
      {bottomNode}
    </div>
  );
};
