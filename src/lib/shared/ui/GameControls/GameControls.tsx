import { CSSProperties, FC } from "react";
import styles from "./GameControls.module.scss";
import { IGDBGame } from "../../types/igdb";
import { Icon } from "@iconify/react";
import classNames from "classnames";

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
  const addToList = (name: string) => {
    return;
  };
  return (
    <div className={classNames(styles.controls, className)} style={style}>
      <button className={styles.controls__action}>
        <Icon icon="iconamoon:play-circle-light" />
      </button>
      <button className={styles.controls__action}>
        <Icon icon="iconamoon:check-circle-1-light" />
      </button>
      <button className={styles.controls__action}>
        <Icon icon="iconamoon:sign-plus-circle-light" />
      </button>
      <button className={styles.controls__action}>
        <Icon icon="iconamoon:sign-times-circle-light" />
      </button>
      <button disabled className={styles.controls__action}>
        <Icon icon="iconamoon:menu-kebab-horizontal-circle-light" />
      </button>
    </div>
  );
};
