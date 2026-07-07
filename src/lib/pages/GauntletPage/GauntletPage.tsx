"use client";

import { FC, useCallback, useEffect } from "react";
import styles from "./GauntletPage.module.scss";
import { ConsolesList } from "../../widgets/main";
import { WheelContainer } from "../../widgets/wheel";
import { ExpandMenu } from "../../shared/ui/ExpandMenu";
import { useStatesStore } from "../../shared/store/states.store";
import classNames from "classnames";
import { useGamesStore } from "../../shared/store/games.store";
import { parseQueryFilters } from "../../shared/utils/filters.utils";
import { Filters } from "../../shared/ui/Filters";
import { BGImage } from "../../shared/ui/BGImage";
import { useWheelStore } from "../../shared/store/wheel.store";

export const GauntletPage: FC = () => {
  const winner = useWheelStore((state) => state.winner);
  const isRoyal = useStatesStore((state) => state.isRoyal);

  return (
    <div className={classNames(styles.page)}>
      {!isRoyal && (
        <ExpandMenu id="consoles" titleOpen="Filters" position="left">
          <Filters isGauntlet />
        </ExpandMenu>
      )}
      <ExpandMenu id="consoles" titleOpen="Lists" position="right">
        <ConsolesList />
      </ExpandMenu>
      <BGImage game={winner} />
      <WheelContainer />
    </div>
  );
};
