import { CSSProperties, FC, useMemo, useRef } from "react";
import styles from "./GameControls.module.scss";
import classNames from "classnames";
import { Button, ButtonColor } from "../Button";
import { useAuthStore } from "../../store/auth.store";
import { modal } from "../Modal";
import { PlaythroughModal } from "../PlaythroughModal";
import { useUserStore } from "../../store/user.store";
import { GameButtons } from "../GameButtons";
import { SvgCircleMenu, SvgPlay } from "../svg";
import { IGameResponse } from "@mooncellar/schemas";

interface IGameControlsProps {
  style?: CSSProperties;
  className?: string;
  game: IGameResponse;
}

export const GameControls: FC<IGameControlsProps> = ({
  game,
  className,
  style,
}) => {
  const profile = useAuthStore((s) => s.profile);
  const parsedPlaythroughs = useUserStore((s) => s.parsedPlaythroughs);

  const isPlaythroughExist = useMemo(() => {
    return !!parsedPlaythroughs?.[game._id]?.length;
  }, [parsedPlaythroughs, game]);

  const controlsRef = useRef<HTMLDivElement>(null);

  return (
    <div
      className={classNames(styles.controls, className)}
      style={style}
      ref={controlsRef}
    >
      <Button
        onClick={(e) => {
          if (!profile?._id) return;
          e.stopPropagation();
          e.preventDefault();

          !!game._id &&
            !!profile?._id &&
            modal.open(<PlaythroughModal game={game} userId={profile._id} />, {
              id: "game-playthroughs",
              isResizable: true,
            });
        }}
        tooltip={
          !profile?._id
            ? "You must be logged in to view playthroughs"
            : "Playthroughs"
        }
        tooltipAlign="left"
        aria-label="Playthroughs"
        color={ButtonColor.TRANSPARENT}
        className={classNames(styles.controls__action, {
          [styles.controls__action_disabled]: !profile?._id,
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
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();

          modal.open(<GameButtons game={game} />, { id: "game-menu" });
        }}
        color={ButtonColor.TRANSPARENT}
        tooltip="Lists and actions"
        className={classNames(styles.controls__action)}
      >
        <SvgCircleMenu className={classNames(styles.controls__icon)} />
      </Button>
    </div>
  );
};
