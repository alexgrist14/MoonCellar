import { FC, ReactNode, useRef } from "react";
import styles from "./GameCardInfo.module.scss";
import classNames from "classnames";
import Link from "next/link";
import { IGDBGameMinimal } from "@/src/lib/shared/types/igdb";
import { commonUtils } from "@/src/lib/shared/utils/common";
import { IPlaythroughMinimal } from "@/src/lib/shared/lib/schemas/playthroughs.schema";

interface IGameCardInfoProps {
  bottomNode: ReactNode;
  game: IGDBGameMinimal;
  playthroughs?: IPlaythroughMinimal[];
}

export const GameCardInfo: FC<IGameCardInfoProps> = ({
  bottomNode,
  game,
  playthroughs,
}) => {
  const infoRef = useRef<HTMLDivElement>(null);

  return (
    <div
      id="game-info"
      className={classNames(
        styles.info,
        playthroughs?.map((play) => styles[`info_${play.category}`]),
        !!playthroughs &&
          playthroughs.some((play) => play.isMastered) &&
          styles.info_mastered
      )}
    >
      <Link
        draggable={false}
        className={styles.info__title}
        href={`/games/${game.slug}`}
      >
        <div className={styles.info__top}>
          <p>{game.name}</p>
          {!!playthroughs && playthroughs.length > 1 && (
            <span>
              ( {playthroughs.length}{" "}
              {commonUtils.addLastS("Playthrough", playthroughs.length)} )
            </span>
          )}
          {!!game.summary && (infoRef.current?.clientHeight || 0) >= 140 && (
            <span>{game.summary}</span>
          )}
        </div>
        <span className={styles.info__category}>
          {game.game_type.type}
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
