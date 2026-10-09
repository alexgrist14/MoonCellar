"use client";

import { FC, RefObject } from "react";
import dynamic from "next/dynamic";
import { IGameResponse } from "@mooncellar/schemas";
import { Popover } from "@/src/lib/shared/ui/Popover";
import { ListCheckRowSkeleton } from "../ListCheckRow";
import { useStatesStore } from "@/src/lib/shared/store/states.store";

const ListsPanel = dynamic(
  () => import("./ListsPanel").then((module) => module.ListsPanel),
  {
    loading: () => <ListCheckRowSkeleton />,
  }
);

interface IListsPanelHostProps {
  game: IGameResponse;
  userId: string;
}

export const ListsPopover: FC<
  IListsPanelHostProps & {
    anchorRef: RefObject<HTMLButtonElement | null>;
    onClose: () => void;
  }
> = ({ game, userId, anchorRef, onClose }) => {
  const isMobile = useStatesStore((state) => state.isMobile);

  return (
    <Popover
      anchorRef={anchorRef}
      isOpen
      onClose={onClose}
      title="Add to list"
      contentStyle={{ padding: "var(--padding-x3)" }}
    >
      <ListsPanel game={game} userId={userId} isTouch={isMobile} />
    </Popover>
  );
};
