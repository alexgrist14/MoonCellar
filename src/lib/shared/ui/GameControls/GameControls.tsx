import { CSSProperties, FC, useState } from "react";
import styles from "./GameControls.module.scss";
import { IGDBGame } from "../../types/igdb";
import { Icon } from "@iconify/react";
import classNames from "classnames";
import { Button } from "../Button";
import { categoriesType } from "../../types/user.type";
import { userAPI } from "../../api";
import { useAuthStore } from "../../store/auth.store";
import { axiosUtils } from "../../utils/axios";
import { toast } from "../../utils/toast";

interface IGameControlsProps {
  style?: CSSProperties;
  className?: string;
  game: IGDBGame;
}

export const GameControls: FC<IGameControlsProps> = ({
  game,
  className,
  style,
}) => {
  const { userId, profile, setProfile } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  const addToList = (name: categoriesType) => {
    if (!userId) return;
    setIsLoading(true);

    return userAPI
      .addGameToCategory(userId, game._id, name)
      .then((res) => {
        setProfile(res.data);

        setIsLoading(false);
        toast.success({ title: `Game successfully added to ${name}` });
      })
      .catch(axiosUtils.toastError);
  };

  const removeFromList = (name: categoriesType) => {
    if (!userId) return;
    setIsLoading(true);

    return userAPI
      .removeGameFromCategory(userId, game._id, name)
      .then((res) => {
        setProfile(res.data);

        setIsLoading(false);
        toast.success({ title: `Game successfully removed from ${name}` });
      })
      .catch(axiosUtils.toastError);
  };

  const isPlayed = profile?.games?.playing.some((id) => game._id === id);
  const isCompleted = profile?.games?.completed.some((id) => game._id === id);
  const isWishlisted = profile?.games?.wishlist.some((id) => game._id === id);
  const isBacklogged = profile?.games?.backlog.some((id) => game._id === id);
  const isDropped = profile?.games?.dropped.some((id) => game._id === id);

  return (
    <div
      className={classNames(styles.controls, className, {
        [styles.controls_disabled]: !userId || isLoading,
      })}
      style={style}
    >
      <Button
        onClick={() =>
          isPlayed ? removeFromList("playing") : addToList("playing")
        }
        color="transparent"
        tooltip={`${isPlayed ? "Remove from" : "Add to"} playing`}
        className={classNames(styles.controls__action, {
          [styles.controls__action_active]: isPlayed,
        })}
      >
        <Icon icon="iconamoon:play-circle-light" />
      </Button>
      <Button
        onClick={() =>
          isCompleted ? removeFromList("completed") : addToList("completed")
        }
        color="transparent"
        tooltip={`${isCompleted ? "Remove from" : "Add to"} completed`}
        className={classNames(styles.controls__action, {
          [styles.controls__action_active]: profile?.games?.completed.some(
            (id) => game._id === id
          ),
        })}
      >
        <Icon icon="iconamoon:check-circle-1-light" />
      </Button>
      <Button
        onClick={() =>
          isWishlisted ? removeFromList("wishlist") : addToList("wishlist")
        }
        color="transparent"
        tooltip={`${isWishlisted ? "Remove from" : "Add to"} wishlist`}
        className={classNames(styles.controls__action, {
          [styles.controls__action_active]: profile?.games?.wishlist.some(
            (id) => game._id === id
          ),
        })}
      >
        <Icon icon="iconamoon:sign-plus-circle-light" />
      </Button>
      <Button
        onClick={() =>
          isBacklogged ? removeFromList("backlog") : addToList("backlog")
        }
        color="transparent"
        tooltip={`${isBacklogged ? "Remove from" : "Add to"} backlog`}
        className={classNames(styles.controls__action, {
          [styles.controls__action_active]: profile?.games?.backlog.some(
            (id) => game._id === id
          ),
        })}
      >
        <Icon icon="iconamoon:menu-kebab-horizontal-circle-light" />
      </Button>
      <Button
        onClick={() =>
          isDropped ? removeFromList("dropped") : addToList("dropped")
        }
        color="transparent"
        tooltip={`${isDropped ? "Remove from" : "Add to"} dropped`}
        className={classNames(styles.controls__action, {
          [styles.controls__action_active]: profile?.games?.dropped.some(
            (id) => game._id === id
          ),
        })}
      >
        <Icon icon="iconamoon:sign-times-circle-light" />
      </Button>
    </div>
  );
};
