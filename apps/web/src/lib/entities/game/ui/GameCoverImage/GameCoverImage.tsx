import { FC } from "react";
import Image from "next/image";
import { IGameResponse } from "@mooncellar/schemas";
import { Cover } from "@/src/lib/shared/ui/Cover";
import styles from "./GameCoverImage.module.scss";

export const GameCoverImage: FC<{
  game: Pick<IGameResponse, "cover">;
  sizes: string;
}> = ({ game, sizes }) =>
  game.cover ? (
    <Image
      src={game.cover}
      alt=""
      fill
      sizes={sizes}
      className={styles.image}
    />
  ) : (
    <Cover isWithoutText className={styles.image} />
  );
