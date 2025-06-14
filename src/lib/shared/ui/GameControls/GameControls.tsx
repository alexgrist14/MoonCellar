import { CSSProperties, FC, useMemo, useRef } from "react";
import styles from "./GameControls.module.scss";
import { IGDBGameMinimal } from "../../types/igdb";
import { Icon } from "@iconify/react";
import classNames from "classnames";
import { Button } from "../Button";
import { useAuthStore } from "../../store/auth.store";
import { accentColor, accentColorRGB } from "../../constants";
import { modal } from "../Modal";
import { PlaythroughModal } from "../PlaythroughModal";
import { useUserStore } from "../../store/user.store";
import { GameRating } from "@/src/lib/features/game/GameRating";
import { GameButtons } from "../GameButtons";
import { SvgBurger } from "../svg";
import { WrapperTemplate } from "../WrapperTemplate";

interface IGameControlsProps {
  style?: CSSProperties;
  className?: string;
  game: IGDBGameMinimal;
}

export const GameControls: FC<IGameControlsProps> = ({
  game,
  className,
  style,
}) => {
  const { profile } = useAuthStore();
  const { playthroughs } = useUserStore();

  const controlsRef = useRef<HTMLDivElement>(null);
  const ratingButtonRef = useRef<HTMLButtonElement>(null);

  const rating = useMemo(
    () => profile?.gamesRating?.find((rating) => rating.game === game._id),
    [game, profile]
  );

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
            modal.open(<PlaythroughModal game={game} userId={profile._id} />);
        }}
        disabled={!profile?._id}
        color="transparent"
        tooltip={"Playthroughs"}
        tooltipAlign="left"
        className={classNames(styles.controls__action, {
          [styles.controls__action_active]: !!playthrough,
        })}
      >
        <Icon
          className={classNames(styles.controls__icon, {
            [styles.controls__icon_active]: !!playthrough,
          })}
          icon="iconamoon:play-circle"
        />
      </Button>
      <Button
        onClick={() =>
          modal.open(
            <WrapperTemplate>
              <GameButtons game={game} />
            </WrapperTemplate>
          )
        }
        tooltip={"Game menu"}
        color="transparent"
        className={classNames(styles.controls__action)}
      >
        <SvgBurger className={classNames(styles.controls__icon)} />
      </Button>
      <Button
        ref={ratingButtonRef}
        tooltip={"Set rating"}
        tooltipAlign="right"
        onClick={() => {
          modal.open(<GameRating rating={rating?.rating} game={game} />);
        }}
        disabled={!profile?._id}
        color="transparent"
        className={classNames(styles.controls__action, {
          [styles.controls__action_active]: !!rating,
        })}
      >
        {!rating?.rating ? (
          <Icon
            className={classNames(styles.controls__icon)}
            icon={"tabler:moon-stars"}
          />
        ) : (
          <Icon
            style={{
              filter: `drop-shadow(0 0 ${rating.rating * 0.05}rem ${accentColor})`,
              backgroundColor: `rgba(${accentColorRGB}, ${rating.rating * 0.1})`,
            }}
            className={classNames(styles.controls__number)}
            icon={`mdi:numeric-${rating.rating}`}
          />
        )}
      </Button>
    </div>
  );
};
