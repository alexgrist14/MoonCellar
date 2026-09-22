"use client";

import { FC } from "react";
import styles from "./GauntletPage.module.scss";
import { ConsolesList } from "@/src/lib/widgets/main";
import { WheelContainer } from "@/src/lib/widgets/wheel";
import { ExpandMenu } from "@/src/lib/shared/ui/ExpandMenu";
import { useStatesStore } from "@/src/lib/shared/store/states.store";
import classNames from "classnames";
import { Filters } from "@/src/lib/features/filters/ui/Filters";
import { BGImage } from "@/src/lib/shared/ui/BGImage";
import { useWheelStore } from "@/src/lib/shared/store/wheel.store";

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
