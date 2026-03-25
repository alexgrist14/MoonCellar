import { CSSProperties, FC, useMemo, useRef } from "react";
import styles from "./GameControls.module.scss";
import classNames from "classnames";
import { Button } from "../Button";
import { useAuthStore } from "../../store/auth.store";
import { modal } from "../Modal";
import { PlaythroughModal } from "../PlaythroughModal";
import { useUserStore } from "../../store/user.store";
import { GameButtons } from "../GameButtons";
import { WrapperTemplate } from "../WrapperTemplate";
import { SvgAchievement, SvgCircleMenu, SvgPlay } from "../svg";
import { IGameResponse } from "../../lib/schemas/games.schema";

interface IGameControlsProps {
  style?: CSSProperties;
  className?: string;
  game: IGameResponse;
  isRelative?: boolean;
}

export const GameControls: FC<IGameControlsProps> = ({
  game,
  className,
  style,
  isRelative,
}) => {
  const profile = useAuthStore((s) => s.profile);
  const parsedPlaythroughs = useUserStore((s) => s.parsedPlaythroughs);

  const isPlaythroughExist = useMemo(() => {
    return !!parsedPlaythroughs?.[game._id]?.length;
  }, [parsedPlaythroughs, game]);

  const controlsRef = useRef<HTMLDivElement>(null);

  const { isMastered, isBeaten } = useMemo(() => {
    if (!profile?.raAwards?.length || !game.retroachievements?.length) {
      return { isMastered: false, isBeaten: false };
    }

    const raIds = new Set(game.retroachievements.map((item) => item.gameId));

    return {
      isMastered: profile.raAwards.some(
        (award) => award.awardType === "Mastery/Completion" && raIds.has(award.awardData)
      ),
      isBeaten: profile.raAwards.some(
        (award) => award.awardType === "Game Beaten" && raIds.has(award.awardData)
      ),
    };
  }, [game, profile]);

  return (
    <div
      className={classNames(styles.controls, className, {
        [styles.controls_relative]: isRelative,
      })}
      style={style}
      ref={controlsRef}
    >
      <Button
        onClick={() => {
          !!game._id &&
            !!profile?._id &&
            modal.open(<PlaythroughModal game={game} userId={profile._id} />, {
              id: "game-playthroughs",
            });
        }}
        disabled={!profile?._id}
        color="transparent"
        tooltipAlign="left"
        className={classNames(styles.controls__action, {
          [styles.controls__action_active]: isPlaythroughExist,
        })}
      >
        <SvgPlay
          className={classNames(styles.controls__icon, {
            [styles.controls__icon_active]: isPlaythroughExist,
          })}
        />
      </Button>
      <Button
        onClick={() =>
          modal.open(
            <WrapperTemplate>
              <GameButtons game={game} />
            </WrapperTemplate>,
            { id: "game-menu" }
          )
        }
        color="transparent"
        className={classNames(styles.controls__action)}
      >
        <SvgCircleMenu className={classNames(styles.controls__icon)} />
      </Button>
      {!!game.retroachievements?.length && (
        <Button
          onClick={() => {}}
          color="transparent"
          className={classNames(styles.controls__action)}
        >
          <SvgAchievement
            className={classNames(styles.controls__icon, {
              [styles.controls__icon_beaten]: isBeaten,
              [styles.controls__icon_mastered]: isMastered,
            })}
          />
        </Button>
      )}
    </div>
  );
};
