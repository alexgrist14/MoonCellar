import { CSSProperties, FC, useMemo, useRef } from "react";
import styles from "./GameControls.module.scss";
import classNames from "classnames";
import { Button, ButtonColor } from "../Button";
import { useAuthStore } from "../../store/auth.store";
import { modal } from "../Modal";
import { PlaythroughModal } from "../PlaythroughModal";
import { useUserStore } from "../../store/user.store";
import { GameButtons } from "../GameButtons";
import { WrapperTemplate } from "../WrapperTemplate";
import { SvgCircleMenu, SvgPlay } from "../svg";
import { IGameResponse } from "../../lib/schemas/games.schema";

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
  const { profile } = useAuthStore();
  const { playthroughs } = useUserStore();
  const { ratings } = useUserStore();

  const controlsRef = useRef<HTMLDivElement>(null);

  const playthrough = useMemo(
    () =>
      !!playthroughs?.length &&
      playthroughs.findLast((play) => play.gameId === game._id),
    [playthroughs, game]
  );

  return (
    <div
      className={classNames(styles.controls, className)}
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
        color={ButtonColor.TRANSPARENT}
        tooltip={"Playthroughs"}
        tooltipAlign="left"
        className={classNames(styles.controls__action, {
          [styles.controls__action_active]: !!playthrough,
        })}
      >
        <SvgPlay
          className={classNames(styles.controls__icon, {
            [styles.controls__icon_active]: !!playthrough,
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
        tooltip={"Game menu"}
        color={ButtonColor.TRANSPARENT}
        className={classNames(styles.controls__action)}
      >
        <SvgCircleMenu className={classNames(styles.controls__icon)} />
      </Button>
    </div>
  );
};
