import { FC } from "react";
import styles from "./GameCardInfo.module.scss";
import classNames from "classnames";
import { commonUtils } from "@/src/lib/shared/utils/common.utils";
import { IPlaythroughMinimal } from "@/src/lib/shared/lib/schemas/playthroughs.schema";
import { IGameResponse } from "@/src/lib/shared/lib/schemas/games.schema";
import { useCommonStore } from "@/src/lib/shared/store/common.store";
import { GameControls } from "@/src/lib/shared/ui/GameControls";

interface IGameCardInfoProps {
  game: IGameResponse;
  playthroughs?: IPlaythroughMinimal[];
}

export const GameCardInfo: FC<IGameCardInfoProps> = ({
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
      <GameControls game={game} />
      <div className={styles.info__block}>
        <p>{game.name}</p>
        {!!playthroughs && playthroughs.length > 1 && (
          <span>
            ( {playthroughs.length}{" "}
            {commonUtils.addLastS("Playthrough", playthroughs.length)} )
          </span>
        )}
      </div>
      <div className={styles.info__block}>
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
      {!!game.summary && (
        <div className={styles.info__block}>
          <span className={styles.info__description}>{game.summary}</span>
        </div>
      )}
    </div>
  );
};
