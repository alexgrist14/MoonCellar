import { CSSProperties, FC, useEffect, useMemo, useRef, useState } from "react";
import styles from "./GameControls.module.scss";
import { IGDBGameMinimal } from "../../types/igdb";
import { Icon } from "@iconify/react";
import classNames from "classnames";
import { Button } from "../Button";
import { userAPI } from "../../api";
import { useAuthStore } from "../../store/auth.store";
import { axiosUtils } from "../../utils/axios";
import { toast } from "../../utils/toast";
import useCloseEvents from "../../hooks/useCloseEvents";
import { RangeSelector } from "../RangeSelector";
import { accentColor, accentColorRGB } from "../../constants";
import { useGamesStore } from "../../store/games.store";
import { modal } from "../Modal";
import { PlaythroughModal } from "../PlaythroughModal";
import { useUserStore } from "../../store/user.store";

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
  // const {sync, isLoading} = useAsyncLoader();
  const { profile, setProfile } = useAuthStore();
  const { playthroughs } = useUserStore();
  const { royalGames, addRoyalGame, removeRoyalGame } = useGamesStore();

  const ratingsRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<HTMLDivElement>(null);
  const ratingButtonRef = useRef<HTMLButtonElement>(null);

  const [isRatingActive, setIsRatingActive] = useState(false);

  const [ratingValue, setRatingValue] = useState(0);

  const rating = useMemo(
    () => profile?.gamesRating?.find((rating) => rating.game === game._id),
    [game, profile]
  );

  const isRoyal = useMemo(
    () => royalGames?.some((royal) => royal._id === game?._id),
    [game, royalGames]
  );

  const playthrough = useMemo(
    () =>
      !!playthroughs?.length &&
      playthroughs.findLast((play) => play.gameId === game._id),
    [playthroughs, game]
  );

  useCloseEvents([controlsRef], () => {
    setIsRatingActive(false);
  });

  useEffect(() => {
    setRatingValue(!!rating ? rating.rating : 0);
  }, [rating]);

  return (
    <div
      className={classNames(styles.controls, className, {
        // [styles.controls_disabled]: isLoading,
        [styles.controls_hidden]: !profile,
      })}
      style={style}
      ref={controlsRef}
    >
      <div
        ref={ratingsRef}
        style={{
          bottom: `calc(${ratingButtonRef.current?.offsetHeight}px)`,
        }}
        className={classNames(styles.controls__ratings, {
          [styles.controls__ratings_active]: isRatingActive,
        })}
      >
        {
          <RangeSelector
            callback={(value) => setRatingValue(value)}
            finalCallback={(value) => {
              if (!rating?.rating && !value) return;
              if (!profile || value === rating?.rating) return;

              userAPI[!!value ? "addGameRating" : "removeGameRating"](
                profile._id,
                game._id,
                value
              )
                .then((res) => {
                  toast.success({
                    description: `${
                      !!value ? `Set rating - ${value}` : "Remove rating"
                    } for ${game.name}`,
                  });
                  setProfile(res.data);
                })
                .catch(axiosUtils.toastError);
            }}
            text={!!ratingValue ? ratingValue.toString() : "No rating"}
            min={0}
            max={10}
            defaultValue={ratingValue || rating?.rating}
            disabled={false}
          />
        }
      </div>
      <Button
        onClick={() => {
          !!game._id &&
            !!profile?._id &&
            modal.open(<PlaythroughModal game={game} userId={profile._id} />);
        }}
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
        onClick={() => (isRoyal ? removeRoyalGame(game) : addRoyalGame(game))}
        tooltip={(isRoyal ? "Remove from" : "Add to") + " royal games"}
        color="transparent"
        className={classNames(styles.controls__action, {
          [styles.controls__action_active]: isRoyal,
        })}
      >
        <Icon
          className={classNames(styles.controls__icon, {
            [styles.controls__icon_active]: isRoyal,
          })}
          icon="icon-park-outline:crown-two"
        />
      </Button>
      <Button
        ref={ratingButtonRef}
        tooltip={"Set rating"}
        tooltipAlign="right"
        onClick={() => {
          setIsRatingActive(!isRatingActive);
        }}
        color="transparent"
        className={classNames(styles.controls__action, {
          [styles.controls__action_active]: !!ratingValue || isRatingActive,
        })}
      >
        {!ratingValue ? (
          <Icon
            className={classNames(styles.controls__icon)}
            icon={"tabler:moon-stars"}
          />
        ) : (
          <Icon
            style={{
              filter: `drop-shadow(0 0 ${ratingValue * 0.05}rem ${accentColor})`,
              backgroundColor: `rgba(${accentColorRGB}, ${ratingValue * 0.1})`,
            }}
            className={classNames(styles.controls__number)}
            icon={`mdi:numeric-${ratingValue}`}
          />
        )}
      </Button>
    </div>
  );
};
