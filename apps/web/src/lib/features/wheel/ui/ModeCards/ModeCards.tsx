"use client";

import { FC, ReactNode } from "react";
import { useStatesStore } from "@/src/lib/shared/store/states.store";
import { ChoiceCards } from "@/src/lib/shared/ui/ChoiceCards";
import { SvgRandom } from "@/src/lib/shared/ui/svg";
import { SvgCrown } from "@/src/lib/shared/ui/svg/SvgCrown";

interface IModeCardsProps {
  gauntletCount?: ReactNode;
  royalCount?: ReactNode;
}

export const ModeCards: FC<IModeCardsProps> = ({
  gauntletCount,
  royalCount,
}) => {
  const isRoyal = !!useStatesStore((state) => state.isRoyal);
  const setRoyal = useStatesStore((state) => state.setRoyal);

  return (
    <ChoiceCards
      ariaLabel="Gauntlet mode"
      value={isRoyal}
      onChange={setRoyal}
      options={[
        {
          value: false,
          title: "Gauntlet",
          text: "One spin over the whole catalogue",
          icon: <SvgRandom />,
          meta: gauntletCount,
        },
        {
          value: true,
          title: "Royal",
          text: "Knock-out over your crowned games",
          icon: <SvgCrown />,
          meta: royalCount,
          tone: "attention",
        },
      ]}
    />
  );
};
