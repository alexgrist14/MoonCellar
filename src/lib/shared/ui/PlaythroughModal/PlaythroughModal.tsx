import { FC, useEffect, useState } from "react";
import styles from "./PlaythroughModal.module.scss";
import { IPlaythrough } from "../../types/playthroughs.type";
import { gamesAPI } from "../../api/games.api";

interface IPlaythroughModalProps {
  userId: string;
  gameId: number;
}

export const PlaythroughModal: FC<IPlaythroughModalProps> = ({
  gameId,
  userId,
}) => {
  const [playthroughs, setPlaythroughs] = useState<IPlaythrough[]>([]);

  useEffect(() => {
    gamesAPI.getPlaythroughs({ userId, gameId }).then;
  });

  return (
    <div className={styles.modal}>
      <div className={styles.modal__left}></div>
      <div className={styles.modal__right}></div>
    </div>
  );
};
