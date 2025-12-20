import { FC, ReactNode } from "react";
import styles from "./GameCardInfo.module.scss";
import classNames from "classnames";
import Link from "next/link";
import { commonUtils } from "@/src/lib/shared/utils/common.utils";
import { IPlaythroughMinimal } from "@/src/lib/shared/lib/schemas/playthroughs.schema";
import { IGameResponse } from "@/src/lib/shared/lib/schemas/games.schema";
import { useCommonStore } from "@/src/lib/shared/store/common.store";

interface IGameCardInfoProps {
  bottomNode: ReactNode;
  game: IGameResponse;
  playthroughs?: IPlaythroughMinimal[];
}

export const GameCardInfo: FC<IGameCardInfoProps> = ({
  bottomNode,
  game,
  playthroughs,
}) => {
  const systems = useCommonStore((s) => s.systems);

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
      <Link className={styles.info__content} href={`/games/${game.slug}`}>
        <div className={styles.info__top}>
          <p>{game.name}</p>
          {!!playthroughs && playthroughs.length > 1 && (
            <span>
              ( {playthroughs.length}{" "}
              {commonUtils.addLastS("Playthrough", playthroughs.length)} )
            </span>
          )}
        </div>
        <div className={styles.info__bottom}>
          <span className={styles.info__category}>
            {game.type}
            {!!game.first_release
              ? ` - ${new Date(game.first_release * 1000).getFullYear()}`
              : ""}
          </span>
          <span className={styles.info__platforms}>
            {!!game.platformIds?.length &&
              !!systems &&
              systems
                .filter((sys) => game.platformIds.includes(sys._id))
                .map((platform) => platform.name)
                .join(", ")}
          </span>
        </div>
      </Link>
      {bottomNode}
    </div>
  );
};
