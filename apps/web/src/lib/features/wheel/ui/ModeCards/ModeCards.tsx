"use client";

import { FC } from "react";
import { useStatesStore } from "@/src/lib/shared/store/states.store";
import { useWheelStore } from "@/src/lib/shared/store/wheel.store";
import { useRoyalGames } from "@/src/lib/entities/royal/model/useRoyalGames";
import { Tabs } from "@/src/lib/shared/ui/Tabs";
import { SvgRandom } from "@/src/lib/shared/ui/svg";
import { SvgCrown } from "@/src/lib/shared/ui/svg/SvgCrown";

export const ModeCards: FC = () => {
  const isRoyal = !!useStatesStore((state) => state.isRoyal);
  const setRoyal = useStatesStore((state) => state.setRoyal);
  const { royalGames = [] } = useRoyalGames();
  const setWinner = useWheelStore((state) => state.setWinner);
  const setRoyalRemainingIds = useWheelStore(
    (state) => state.setRoyalRemainingIds
  );

  const switchMode = (nextIsRoyal: boolean) => {
    if (nextIsRoyal === isRoyal) return;

    setWinner(undefined);
    setRoyalRemainingIds([]);
    setRoyal(nextIsRoyal);
  };

  return (
    <Tabs
      theme="segmented"
      ariaLabel="Gauntlet mode"
      isFit
      defaultTabIndex={isRoyal ? 1 : 0}
      isUseDefaultIndex
      contents={[
        {
          tabName: "Catalogue",
          prefix: <SvgRandom size="16" style={{ color: "inherit" }} />,
          tooltip: "One spin over the filtered catalogue",
          onTabClick: () => switchMode(false),
        },
        {
          tabName: "Royal",
          prefix: <SvgCrown size="16" style={{ color: "inherit" }} />,
          count: royalGames.length,
          tooltip: "Knock-out over your crowned games",
          onTabClick: () => switchMode(true),
        },
      ]}
    />
  );
};
