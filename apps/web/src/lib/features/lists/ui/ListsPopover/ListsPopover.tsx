"use client";

import { FC, RefObject } from "react";
import dynamic from "next/dynamic";
import { IGameResponse } from "@mooncellar/schemas";
import { Box } from "@/src/lib/shared/ui/Box";
import { Loader } from "@/src/lib/shared/ui/Loader";
import { Popover } from "@/src/lib/shared/ui/Popover";
import styles from "./ListsPopover.module.scss";

const ListsPanel = dynamic(
  () => import("./ListsPanel").then((module) => module.ListsPanel),
  {
    loading: () => (
      <div className={styles.loading}>
        <Loader />
      </div>
    ),
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
> = ({ game, userId, anchorRef, onClose }) => (
  <Popover
    anchorRef={anchorRef}
    isOpen
    onClose={onClose}
    title="Add to list"
    contentStyle={{ padding: "var(--padding-x3)" }}
  >
    <ListsPanel game={game} userId={userId} />
  </Popover>
);

export const ListsModal: FC<IListsPanelHostProps> = ({ game, userId }) => (
  <Box
    title="Add to list"
    isTitleStart
    className={styles.modal}
    contentStyle={{ padding: "var(--padding-x4)" }}
  >
    <ListsPanel game={game} userId={userId} isTouch />
  </Box>
);
