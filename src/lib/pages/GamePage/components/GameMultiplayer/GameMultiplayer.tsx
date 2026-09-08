"use client";

import { FC, useMemo } from "react";
import styles from "./GameMultiplayer.module.scss";
import { Box } from "@/src/lib/shared/ui/Box";
import { IGameResponse } from "@/src/lib/shared/lib/schemas/games.schema";
import { useCommonStore } from "@/src/lib/shared/store/common.store";
import { formatMultiplayerMode } from "@/src/lib/shared/utils/multiplayer.utils";

interface IGameMultiplayerProps {
  game: IGameResponse;
  className?: string;
}

export const GameMultiplayer: FC<IGameMultiplayerProps> = ({
  game,
  className,
}) => {
  const { systems } = useCommonStore();

  const modes = useMemo(
    () =>
      (game.multiplayer_modes || [])
        .map((mode) => ({
          platformId: mode.platformId,
          labels: formatMultiplayerMode(mode),
        }))
        .filter((mode) => !!mode.labels.length),
    [game.multiplayer_modes]
  );

  if (!modes.length) return null;

  return (
    <Box
      title="Multiplayer"
      isTitleStart
      className={className}
      wrapperStyle={{ height: "auto" }}
      templateStyle={{ height: "100%" }}
      classNameContent={styles.multiplayer}
    >
      {modes.map((mode, i) => {
        const platform = systems?.find((sys) => sys._id === mode.platformId);

        return (
          <p key={(mode.platformId || "") + i}>
            {!!platform && <span>{platform.name}: </span>}
            {mode.labels.join(", ")}
          </p>
        );
      })}
    </Box>
  );
};
